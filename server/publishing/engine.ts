import 'server-only';

import { randomUUID } from 'node:crypto';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  normalizeProviderError,
  ProviderPublishError,
} from '@/server/publishing/errors';
import type { ProviderMediaAsset } from '@/server/publishing/adapters/types';
import { getProviderMediaAssets } from '@/server/publishing/media-assets';
import { publishToProvider } from '@/server/publishing/provider-adapters';
import { getActiveProviderToken } from '@/server/connections/token-store';
import type {
  Database,
  PostTargetStatus,
  PublishJobStatus,
} from '@/types/database';

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type PublishJob = Database['public']['Tables']['publish_jobs']['Row'];
type PostTarget = Database['public']['Tables']['post_platform_targets']['Row'];

export type PublishRunResult = {
  workerId: string;
  claimed: number;
  processed: number;
  succeeded: number;
  failed: number;
  retryScheduled: number;
};

type TargetResult =
  | { status: 'succeeded' }
  | {
      status: 'failed';
      retryAfter: string | null;
      code: string;
      message: string;
    };

export async function runPublishEngine({
  limit = 5,
}: { limit?: number } = {}): Promise<PublishRunResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error('Supabase service role is not configured.');
  }

  const workerId = `worker_${randomUUID()}`;
  const { data: jobs, error } = await supabase.rpc('claim_publish_jobs', {
    worker_id_input: workerId,
    limit_input: limit,
    lock_seconds_input: 300,
  });

  if (error) {
    throw new Error(
      'Publish jobs could not be claimed. Confirm database migrations are applied.',
    );
  }

  const result: PublishRunResult = {
    workerId,
    claimed: jobs.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    retryScheduled: 0,
  };

  for (const job of jobs) {
    const jobResult = await processPublishJob(supabase, job);
    result.processed += 1;
    result.succeeded += jobResult.succeeded;
    result.failed += jobResult.failed;
    result.retryScheduled += jobResult.retryScheduled;
  }

  return result;
}

async function processPublishJob(supabase: AdminClient, job: PublishJob) {
  await updateJob(supabase, job.id, {
    status: 'running',
  });

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id,user_id,body,status')
    .eq('id', job.post_id)
    .single();

  if (postError || !post) {
    await failWholeJob(
      supabase,
      job,
      'post_missing',
      'The post for this job no longer exists.',
    );
    return { succeeded: 0, failed: 1, retryScheduled: 0 };
  }

  if (!isPostPublishable(post.status)) {
    await updateJob(supabase, job.id, {
      status: post.status === 'canceled' ? 'canceled' : 'succeeded',
      locked_until: null,
      last_error_code: null,
      last_error_message: null,
    });
    return { succeeded: 0, failed: 0, retryScheduled: 0 };
  }

  const { data: targets, error: targetsError } = await supabase
    .from('post_platform_targets')
    .select('*')
    .eq('post_id', post.id)
    .in('status', ['pending', 'queued', 'retry_scheduled']);

  if (targetsError || !targets || targets.length === 0) {
    await failWholeJob(
      supabase,
      job,
      'targets_missing',
      'No publish targets are ready for this job.',
    );
    return { succeeded: 0, failed: 1, retryScheduled: 0 };
  }

  await supabase.from('activity_events').insert({
    user_id: post.user_id,
    post_id: post.id,
    type: 'publish_started',
    title: 'Publishing started',
    message: 'The publishing engine claimed this post.',
  });

  let succeeded = 0;
  let failed = 0;
  let retryScheduled = 0;
  let earliestRetryAt: string | null = null;
  let lastFailure: { code: string; message: string } | null = null;
  const mediaAssets = await getProviderMediaAssets({
    postId: post.id,
    userId: post.user_id,
    supabase,
  });

  for (const target of targets) {
    const targetResult = await processTarget(
      supabase,
      job,
      post,
      target,
      mediaAssets,
    );

    if (targetResult.status === 'succeeded') {
      succeeded += 1;
    } else {
      lastFailure = {
        code: targetResult.code,
        message: targetResult.message,
      };

      if (targetResult.retryAfter) {
        retryScheduled += 1;
        earliestRetryAt = getEarliestRetryAt(
          earliestRetryAt,
          targetResult.retryAfter,
        );
      } else {
        failed += 1;
      }
    }
  }

  const hasRetriesPending = retryScheduled > 0;
  const status: PublishJobStatus = hasRetriesPending
    ? 'queued'
    : failed === 0
      ? 'succeeded'
      : succeeded > 0
        ? 'partially_failed'
        : 'failed';
  const postStatus = hasRetriesPending
    ? succeeded > 0
      ? 'partially_failed'
      : 'queued'
    : failed === 0
      ? 'published'
      : succeeded > 0
        ? 'partially_failed'
        : 'failed';

  await updateJob(supabase, job.id, {
    status,
    run_at: earliestRetryAt ?? job.run_at,
    locked_until: null,
    last_error_code: lastFailure?.code ?? null,
    last_error_message: lastFailure?.message ?? null,
  });

  await supabase
    .from('posts')
    .update({
      status: postStatus,
      published_at: succeeded > 0 ? new Date().toISOString() : null,
    })
    .eq('id', post.id);

  await supabase.from('activity_events').insert({
    user_id: post.user_id,
    post_id: post.id,
    type: hasRetriesPending
      ? 'retry_scheduled'
      : failed === 0
        ? 'publish_succeeded'
        : 'publish_failed',
    title: hasRetriesPending
      ? 'Retry scheduled'
      : failed === 0
        ? 'Post published'
        : 'Publishing finished with issues',
    message: `${succeeded} target(s) succeeded, ${failed} target(s) failed, ${retryScheduled} target(s) queued for retry.`,
  });

  if (succeeded > 0) {
    // A streak counts once per creator day when at least one target publishes.
    // Multi-platform posts should feel like one creator win, not inflated math.
    await supabase.rpc('record_publish_streak_success', {
      user_id_input: post.user_id,
      post_id_input: post.id,
      occurred_at_input: new Date().toISOString(),
    });
  }

  return { succeeded, failed, retryScheduled };
}

async function processTarget(
  supabase: AdminClient,
  job: PublishJob,
  post: { id: string; user_id: string; body: string },
  target: PostTarget,
  mediaAssets: ProviderMediaAsset[],
) {
  await updateTarget(supabase, target.id, {
    status: 'publishing',
    last_error_code: null,
    last_error_message: null,
  });

  const attemptNumber = await getNextAttemptNumber(supabase, job.id, target.id);
  const { data: attempt, error: attemptError } = await supabase
    .from('publish_attempts')
    .insert({
      user_id: post.user_id,
      publish_job_id: job.id,
      post_platform_target_id: target.id,
      platform: target.platform,
      attempt_number: attemptNumber,
      status: 'started',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (attemptError || !attempt) {
    await updateTarget(supabase, target.id, {
      status: 'failed',
      last_error_code: 'attempt_create_failed',
      last_error_message: 'Attempt could not be recorded.',
    });
    return {
      status: 'failed',
      retryAfter: null,
      code: 'attempt_create_failed',
      message: 'Attempt could not be recorded.',
    } satisfies TargetResult;
  }

  const token = await getActiveProviderToken({
    userId: post.user_id,
    platform: target.platform,
  });

  try {
    if (!token.ok) {
      throw new ProviderTokenPublishError(token);
    }

    const providerResult = await publishToProvider({
      platform: target.platform,
      postId: post.id,
      targetId: target.id,
      body: target.platform_body ?? post.body,
      connection: {
        id: token.connectionId,
        accessToken: token.accessToken,
        providerAccountId: token.providerAccountId,
        scopes: token.scopes,
        metadata: token.metadata,
      },
      media: mediaAssets,
    });

    await supabase
      .from('publish_attempts')
      .update({
        status: 'succeeded',
        provider_request_id: providerResult.providerRequestId,
        provider_publish_id: providerResult.providerPublishId,
        finished_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);

    await updateTarget(supabase, target.id, {
      status: 'published',
      provider_publish_id: providerResult.providerPublishId,
      provider_permalink: providerResult.providerPermalink,
      published_at: new Date().toISOString(),
    });

    return { status: 'succeeded' } satisfies TargetResult;
  } catch (error) {
    const normalized = normalizeProviderError(error);
    const retryAfter = normalized.retryable
      ? getRetryAfter(job.attempts_count)
      : null;
    const nextStatus: PostTargetStatus = retryAfter
      ? 'retry_scheduled'
      : 'failed';

    await supabase
      .from('publish_attempts')
      .update({
        status: 'failed',
        normalized_error_code: normalized.code,
        normalized_error_message: normalized.message,
        retry_after: retryAfter,
        finished_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);

    await updateTarget(supabase, target.id, {
      status: nextStatus,
      last_error_code: normalized.code,
      last_error_message: normalized.message,
    });

    return {
      status: 'failed',
      retryAfter,
      code: normalized.code,
      message: normalized.message,
    } satisfies TargetResult;
  }
}

class ProviderTokenPublishError extends ProviderPublishError {
  constructor(token: Extract<Awaited<ReturnType<typeof getActiveProviderToken>>, { ok: false }>) {
    super({
      code: token.code,
      message: token.message,
      retryable: token.retryable,
    });
    this.name = 'ProviderTokenPublishError';
  }
}

async function getNextAttemptNumber(
  supabase: AdminClient,
  jobId: string,
  targetId: string,
) {
  const { count } = await supabase
    .from('publish_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('publish_job_id', jobId)
    .eq('post_platform_target_id', targetId);

  return (count ?? 0) + 1;
}

async function failWholeJob(
  supabase: AdminClient,
  job: PublishJob,
  code: string,
  message: string,
) {
  await updateJob(supabase, job.id, {
    status: 'failed',
    locked_until: null,
    last_error_code: code,
    last_error_message: message,
  });
}

function updateJob(
  supabase: AdminClient,
  jobId: string,
  update: Database['public']['Tables']['publish_jobs']['Update'],
) {
  return supabase.from('publish_jobs').update(update).eq('id', jobId);
}

function updateTarget(
  supabase: AdminClient,
  targetId: string,
  update: Database['public']['Tables']['post_platform_targets']['Update'],
) {
  return supabase
    .from('post_platform_targets')
    .update(update)
    .eq('id', targetId);
}

function getRetryAfter(attemptsCount: number) {
  const delayMinutes = Math.min(60, Math.max(5, attemptsCount * 5));
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

function getEarliestRetryAt(current: string | null, candidate: string) {
  if (!current) {
    return candidate;
  }

  return Date.parse(candidate) < Date.parse(current) ? candidate : current;
}

function isPostPublishable(status: string) {
  return ['scheduled', 'queued', 'partially_failed', 'failed'].includes(status);
}
