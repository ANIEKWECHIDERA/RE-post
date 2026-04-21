'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  cancelScheduledPostSchema,
  deleteScheduledPostSchema,
  duplicateScheduledPostSchema,
  editScheduledPostSchema,
  reschedulePostSchema,
  retryFailedPostSchema,
} from '@/schemas/scheduling';
import { getCurrentUser } from '@/server/auth/session';
import { triggerPublishWorkerNow } from '@/server/publishing/worker-trigger';
import {
  isAtLeastOneMinuteInFuture,
  parseCreatorScheduledTime,
} from '@/server/scheduling/time';

export async function cancelScheduledPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return;
  }

  const parsed = cancelScheduledPostSchema.safeParse({
    postId: formData.get('postId'),
  });

  if (!parsed.success) {
    return;
  }

  // Cancellation is deliberately routed through a Postgres function so the
  // post, queued job, platform targets, and audit event change together. RLS
  // still scopes the call to the authenticated creator.
  const { data: canceledByRpc } = await supabase.rpc('cancel_scheduled_post', {
    post_id_input: parsed.data.postId,
  });

  if (!canceledByRpc) {
    // The RPC is the preferred atomic path. This fallback keeps the UI reliable
    // if the deployed function is older than the app code or misses a recoverable
    // job state; every write is still owner-scoped and excludes claimed/running
    // worker jobs.
    const { data: updatedPosts } = await supabase
      .from('posts')
      .update({
        status: 'canceled',
        archived_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.postId)
      .eq('user_id', user.id)
      .in('status', ['scheduled', 'queued'])
      .select('id');

    if (updatedPosts?.length) {
      await supabase
        .from('publish_jobs')
        .update({
          status: 'canceled',
          locked_until: null,
          worker_id: null,
          last_error_code: null,
          last_error_message: null,
        })
        .eq('post_id', parsed.data.postId)
        .eq('user_id', user.id)
        .in('status', ['queued', 'failed', 'partially_failed']);

      await supabase
        .from('post_platform_targets')
        .update({
          status: 'canceled',
          last_error_code: null,
          last_error_message: null,
        })
        .eq('post_id', parsed.data.postId)
        .eq('user_id', user.id)
        .in('status', ['draft', 'pending', 'queued', 'retry_scheduled']);

      await supabase.from('activity_events').insert({
        user_id: user.id,
        post_id: parsed.data.postId,
        type: 'post_updated',
        title: 'Scheduled post canceled',
        message: 'The scheduled post was canceled before publishing.',
        metadata: {
          source: 'schedule_cancel_fallback',
        },
      });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/schedule');
}

export async function reschedulePostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return;
  }

  const parsed = reschedulePostSchema.safeParse({
    postId: formData.get('postId'),
    scheduledAt: formData.get('scheduledAt'),
    timezone: formData.get('timezone'),
  });

  if (!parsed.success) {
    return;
  }

  const scheduledTime = parseCreatorScheduledTime(
    parsed.data.scheduledAt,
    parsed.data.timezone,
  );

  if (!scheduledTime.ok || !isAtLeastOneMinuteInFuture(scheduledTime.iso)) {
    return;
  }

  // Rescheduling is restricted to posts that are not actively being claimed or
  // published. The publish job is moved atomically enough for this phase by
  // matching the same owner and post, while the worker still has row-locking
  // protection when it claims jobs.
  const { data: updatedPosts } = await supabase
    .from('posts')
    .update({
      status: 'scheduled',
      schedule_mode: 'scheduled',
      scheduled_at: scheduledTime.iso,
      timezone: parsed.data.timezone,
    })
    .eq('id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'queued', 'failed', 'partially_failed'])
    .select('id');

  if (!updatedPosts?.length) {
    return;
  }

  await supabase
    .from('publish_jobs')
    .update({
      status: 'queued',
      run_at: scheduledTime.iso,
      claimed_at: null,
      locked_until: null,
      worker_id: null,
      last_error_code: null,
      last_error_message: null,
    })
    .eq('post_id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['queued', 'failed', 'partially_failed', 'canceled']);

  await supabase
    .from('post_platform_targets')
    .update({
      status: 'queued',
      last_error_code: null,
      last_error_message: null,
    })
    .eq('post_id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['queued', 'pending', 'failed', 'retry_scheduled', 'canceled']);

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: parsed.data.postId,
    type: 'post_scheduled',
    title: 'Post rescheduled',
    message: 'Your scheduled post has a new publish time.',
    metadata: {
      scheduledAt: scheduledTime.iso,
      timezone: parsed.data.timezone,
    },
  });

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
}

export async function editScheduledPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const parsed = editScheduledPostSchema.safeParse({
    postId: formData.get('postId'),
    body: formData.get('body'),
  });

  if (!supabase || !user || !parsed.success) {
    return;
  }

  // Text edits are allowed only before an active worker starts publishing. The
  // selected target payloads mirror the post body so each adapter receives the
  // latest creator-approved caption.
  const { data: updatedPosts } = await supabase
    .from('posts')
    .update({ body: parsed.data.body })
    .eq('id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'queued', 'failed', 'partially_failed'])
    .select('id');

  if (!updatedPosts?.length) {
    return;
  }

  await supabase
    .from('post_platform_targets')
    .update({ platform_body: parsed.data.body })
    .eq('post_id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['queued', 'pending', 'failed', 'retry_scheduled']);

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: parsed.data.postId,
    type: 'post_updated',
    title: 'Scheduled post edited',
    message: 'The caption was updated before publishing.',
  });

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
}

export async function duplicateScheduledPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const parsed = duplicateScheduledPostSchema.safeParse({
    postId: formData.get('postId'),
  });

  if (!supabase || !user || !parsed.success) {
    return;
  }

  const { data: source } = await supabase
    .from('posts')
    .select('id,body,timezone')
    .eq('id', parsed.data.postId)
    .eq('user_id', user.id)
    .eq('schedule_mode', 'scheduled')
    .maybeSingle();

  if (!source) {
    return;
  }

  const duplicateId = randomUUID();
  const { error: postError } = await supabase.from('posts').insert({
    id: duplicateId,
    user_id: user.id,
    body: source.body,
    status: 'draft',
    schedule_mode: 'now',
    timezone: source.timezone,
  });

  if (postError) {
    return;
  }

  const [{ data: targets }, { data: mediaLinks }] = await Promise.all([
    supabase
      .from('post_platform_targets')
      .select('platform,platform_body,settings,validation_warnings')
      .eq('user_id', user.id)
      .eq('post_id', source.id),
    supabase
      .from('post_media_assets')
      .select('media_asset_id,sort_order')
      .eq('user_id', user.id)
      .eq('post_id', source.id),
  ]);

  if (targets?.length) {
    await supabase.from('post_platform_targets').insert(
      targets.map(target => ({
        post_id: duplicateId,
        user_id: user.id,
        platform: target.platform,
        status: 'draft' as const,
        platform_body: target.platform_body,
        settings: target.settings,
        validation_warnings: target.validation_warnings,
      })),
    );
  }

  if (mediaLinks?.length) {
    await supabase.from('post_media_assets').insert(
      mediaLinks.map(link => ({
        post_id: duplicateId,
        user_id: user.id,
        media_asset_id: link.media_asset_id,
        sort_order: link.sort_order,
      })),
    );
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: duplicateId,
    type: 'post_created',
    title: 'Scheduled post duplicated',
    message: 'A draft copy is ready for editing.',
  });

  revalidatePath('/drafts');
  revalidatePath('/schedule');
}

export async function retryFailedPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const parsed = retryFailedPostSchema.safeParse({
    postId: formData.get('postId'),
  });

  if (!supabase || !user || !parsed.success) {
    return;
  }

  const now = new Date().toISOString();

  // Manual retry means the creator has taken an explicit recovery action, often
  // after reconnecting a provider account. We reset the job attempt budget while
  // preserving historical publish_attempt rows for auditability.
  const { data: updatedPosts } = await supabase
    .from('posts')
    .update({
      status: 'queued',
      schedule_mode: 'now',
      scheduled_at: null,
    })
    .eq('id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['failed', 'partially_failed'])
    .select('id');

  if (!updatedPosts?.length) {
    return;
  }

  await supabase
    .from('post_platform_targets')
    .update({
      status: 'pending',
      last_error_code: null,
      last_error_message: null,
    })
    .eq('post_id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['failed', 'retry_scheduled']);

  const { data: jobs } = await supabase
    .from('publish_jobs')
    .update({
      status: 'queued',
      run_at: now,
      claimed_at: null,
      locked_until: null,
      worker_id: null,
      attempts_count: 0,
      last_error_code: null,
      last_error_message: null,
    })
    .eq('post_id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['failed', 'partially_failed', 'canceled'])
    .select('id');

  if (!jobs?.length) {
    await supabase.from('publish_jobs').insert({
      user_id: user.id,
      post_id: parsed.data.postId,
      status: 'queued',
      run_at: now,
      idempotency_key: `${parsed.data.postId}:manual-retry:${Date.now()}`,
    });
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: parsed.data.postId,
    type: 'publish_queued',
    title: 'Retry queued',
    message: 'The failed post was sent back to the publishing worker.',
    metadata: {
      source: 'manual_retry',
    },
  });

  await triggerPublishWorkerNow();

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
}

export async function deleteScheduledPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const parsed = deleteScheduledPostSchema.safeParse({
    postId: formData.get('postId'),
  });

  if (!supabase || !user || !parsed.success) {
    return;
  }

  // Scheduled posts may be deleted only after they are terminal. Upcoming posts
  // should be canceled first so the job/target state is auditable.
  await supabase
    .from('posts')
    .delete()
    .eq('id', parsed.data.postId)
    .eq('user_id', user.id)
    .in('status', ['canceled', 'failed']);

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
}
