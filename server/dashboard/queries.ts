import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStreakStatus } from '@/server/streaks/rules';
import type { DashboardSummary } from '@/types/dashboard';
import type { SocialPlatform } from '@/types/database';

export const emptyDashboardSummary: DashboardSummary = {
  currentStreak: 0,
  longestStreak: 0,
  streakStatus: getStreakStatus({
    currentCount: 0,
    lastCountedOn: null,
    timezone: 'UTC',
  }),
  postsThisWeek: 0,
  scheduledPosts: 0,
  connectedPlatforms: 0,
  recentActivity: [],
  scheduledQueue: [],
  loadedFromSupabase: false,
};

export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyDashboardSummary;
  }

  const startOfWeek = getStartOfWeekIso();
  const now = new Date().toISOString();

  const [
    streakResult,
    postsThisWeekResult,
    scheduledPostsResult,
    scheduledQueueResult,
    connectedPlatformsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from('streak_state')
      .select('current_count,longest_count,last_counted_on,timezone')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfWeek),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now),
    supabase
      .from('posts')
      .select('id,body,status,scheduled_at,timezone')
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(5),
    supabase
      .from('social_connections')
      .select('platform', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('activity_events')
      .select('id,type,title,message,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (
    streakResult.error ||
    postsThisWeekResult.error ||
    scheduledPostsResult.error ||
    scheduledQueueResult.error ||
    connectedPlatformsResult.error ||
    activityResult.error
  ) {
    return emptyDashboardSummary;
  }

  return {
    currentStreak: streakResult.data?.current_count ?? 0,
    longestStreak: streakResult.data?.longest_count ?? 0,
    streakStatus: getStreakStatus({
      currentCount: streakResult.data?.current_count ?? 0,
      lastCountedOn: streakResult.data?.last_counted_on ?? null,
      timezone: streakResult.data?.timezone ?? 'UTC',
    }),
    postsThisWeek: postsThisWeekResult.count ?? 0,
    scheduledPosts: scheduledPostsResult.count ?? 0,
    connectedPlatforms: connectedPlatformsResult.count ?? 0,
    recentActivity:
      activityResult.data?.map(event => ({
        id: event.id,
        type: event.type,
        title: event.title,
        message: event.message,
        createdAt: event.created_at,
      })) ?? [],
    scheduledQueue: await attachTargetPlatforms(
      userId,
      scheduledQueueResult.data ?? [],
    ),
    loadedFromSupabase: true,
  };
}

async function attachTargetPlatforms(
  userId: string,
  posts: Array<{
    id: string;
    body: string;
    status: DashboardSummary['scheduledQueue'][number]['status'];
    scheduled_at: string | null;
    timezone: string;
  }>,
) {
  if (posts.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const postIds = posts.map(post => post.id);
  const { data: targets } = await supabase
    .from('post_platform_targets')
    .select('post_id,platform')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const platformsByPost = new Map<string, SocialPlatform[]>();

  for (const target of targets ?? []) {
    const current = platformsByPost.get(target.post_id) ?? [];
    current.push(target.platform);
    platformsByPost.set(target.post_id, current);
  }

  return posts
    .filter(post => post.scheduled_at)
    .map(post => ({
      id: post.id,
      bodyPreview: getBodyPreview(post.body),
      scheduledAt: post.scheduled_at as string,
      timezone: post.timezone,
      status: post.status,
      platforms: platformsByPost.get(post.id) ?? [],
    }));
}

function getBodyPreview(body: string) {
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function getStartOfWeekIso() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}
