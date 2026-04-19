import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBodyPreview, getFirstMediaPreviews } from '@/server/posts/list-helpers';
import type { ScheduledPostsPageData, ScheduledPostStatusGroup } from '@/types/scheduled-posts';

export const emptyScheduledPostsPageData: ScheduledPostsPageData = {
  posts: [],
  loadedFromSupabase: false,
};

export async function getScheduledPostsPageData(
  userId: string,
): Promise<ScheduledPostsPageData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyScheduledPostsPageData;
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(
      'id,body,status,scheduled_at,timezone,published_at,created_at,updated_at',
    )
    .eq('user_id', userId)
    .eq('schedule_mode', 'scheduled')
    .is('archived_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(100);

  if (error) {
    return emptyScheduledPostsPageData;
  }

  const postIds = (posts ?? []).map(post => post.id);
  let targets: Array<{
    post_id: string;
    platform: 'linkedin' | 'facebook' | 'instagram';
    status:
      | 'draft'
      | 'pending'
      | 'queued'
      | 'publishing'
      | 'published'
      | 'failed'
      | 'retry_scheduled'
      | 'canceled';
    provider_permalink: string | null;
    last_error_message: string | null;
  }> = [];
  let jobs: Array<{
    post_id: string;
    status:
      | 'queued'
      | 'claimed'
      | 'running'
      | 'succeeded'
      | 'partially_failed'
      | 'failed'
      | 'canceled';
    run_at: string;
    attempts_count: number;
    last_error_message: string | null;
  }> = [];
  const mediaPreviews = await getFirstMediaPreviews(userId, postIds);

  if (postIds.length > 0) {
    const [targetsResult, jobsResult] = await Promise.all([
      supabase
        .from('post_platform_targets')
        .select('post_id,platform,status,provider_permalink,last_error_message')
        .eq('user_id', userId)
        .in('post_id', postIds),
      supabase
        .from('publish_jobs')
        .select('post_id,status,run_at,attempts_count,last_error_message')
        .eq('user_id', userId)
        .in('post_id', postIds),
    ]);

    targets = targetsResult.data ?? [];
    jobs = jobsResult.data ?? [];
  }

  const targetsByPost = new Map<string, typeof targets>();
  for (const target of targets) {
    const current = targetsByPost.get(target.post_id) ?? [];
    current.push(target);
    targetsByPost.set(target.post_id, current);
  }

  const jobsByPost = new Map(jobs.map(job => [job.post_id, job]));

  return {
    loadedFromSupabase: true,
    posts: (posts ?? []).map(post => {
      const job = jobsByPost.get(post.id) ?? null;

      return {
        id: post.id,
        body: post.body,
        bodyPreview: getBodyPreview(post.body),
        status: post.status,
        statusGroup: getScheduledStatusGroup(post.status),
        scheduledAt: post.scheduled_at,
        publishedAt: post.published_at,
        timezone: post.timezone,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        platforms: (targetsByPost.get(post.id) ?? []).map(target => ({
          platform: target.platform,
          status: target.status,
          providerPermalink: target.provider_permalink,
          lastErrorMessage: target.last_error_message,
        })),
        mediaPreview: mediaPreviews.get(post.id) ?? null,
        job: job
          ? {
              status: job.status,
              runAt: job.run_at,
              attemptsCount: job.attempts_count,
              lastErrorMessage: job.last_error_message,
            }
          : null,
      };
    }),
  };
}

function getScheduledStatusGroup(status: string): ScheduledPostStatusGroup {
  if (status === 'scheduled' || status === 'queued') {
    return 'upcoming';
  }

  if (status === 'publishing') {
    return 'processing';
  }

  if (status === 'failed' || status === 'partially_failed') {
    return 'failed';
  }

  return 'completed';
}
