import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStreakStatus } from '@/server/streaks/rules';
import type {
  DashboardAnalyticsSummary,
  DashboardSummary,
} from '@/types/dashboard';
import type {
  PostStatus,
  ScheduleMode,
  SocialPlatform,
} from '@/types/database';

const platforms: SocialPlatform[] = ['instagram', 'facebook', 'linkedin'];

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
  analytics: getEmptyAnalyticsSummary(),
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
    analyticsResult,
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
      .select('id,type,title,message,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
    getAnalyticsSummary(userId),
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
        metadata: event.metadata,
        createdAt: event.created_at,
      })) ?? [],
    scheduledQueue: await attachTargetPlatforms(
      userId,
      scheduledQueueResult.data ?? [],
    ),
    analytics: analyticsResult,
    loadedFromSupabase: true,
  };
}

async function getAnalyticsSummary(
  userId: string,
): Promise<DashboardAnalyticsSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getEmptyAnalyticsSummary();
  }

  const sixWeekStart = getStartOfWeek(new Date());
  sixWeekStart.setDate(sixWeekStart.getDate() - 5 * 7);

  const [
    postsResult,
    postTargetsResult,
    streakEventsResult,
    totalPostsResult,
    instantPostsResult,
    scheduledModePostsResult,
    publishedPostsResult,
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id,status,schedule_mode,created_at')
      .eq('user_id', userId)
      .gte('created_at', sixWeekStart.toISOString())
      .order('created_at', { ascending: true })
      .limit(1000),
    supabase
      .from('post_platform_targets')
      .select('platform,status')
      .eq('user_id', userId)
      .limit(1000),
    supabase
      .from('streak_events')
      .select('event_date,type,new_count')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
      .limit(8),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('schedule_mode', 'now'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('schedule_mode', 'scheduled'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'published'),
  ]);

  if (
    postsResult.error ||
    postTargetsResult.error ||
    streakEventsResult.error ||
    totalPostsResult.error ||
    instantPostsResult.error ||
    scheduledModePostsResult.error ||
    publishedPostsResult.error
  ) {
    return getEmptyAnalyticsSummary();
  }

  const posts = postsResult.data ?? [];
  const targets = postTargetsResult.data ?? [];
  const successfulTargets = targets.filter(
    target => target.status === 'published',
  ).length;
  const failedTargets = targets.filter(
    target => target.status === 'failed',
  ).length;
  const decidedTargets = successfulTargets + failedTargets;

  return {
    totalPosts: totalPostsResult.count ?? 0,
    instantPosts: instantPostsResult.count ?? 0,
    scheduledPosts: scheduledModePostsResult.count ?? 0,
    publishedPosts: publishedPostsResult.count ?? 0,
    successfulTargets,
    failedTargets,
    publishSuccessRate:
      decidedTargets === 0
        ? 0
        : Math.round((successfulTargets / decidedTargets) * 100),
    platformBreakdown: buildPlatformBreakdown(targets),
    weeklyPosts: buildWeeklyPosts(posts, sixWeekStart),
    streakHistory:
      streakEventsResult.data?.map(event => ({
        date: event.event_date,
        type: event.type,
        count: event.new_count,
      })) ?? [],
  };
}

function getEmptyAnalyticsSummary(): DashboardAnalyticsSummary {
  return {
    totalPosts: 0,
    instantPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    successfulTargets: 0,
    failedTargets: 0,
    publishSuccessRate: 0,
    platformBreakdown: platforms.map(platform => ({
      platform,
      total: 0,
      published: 0,
      failed: 0,
    })),
    weeklyPosts: buildWeeklyPosts([], getSixWeekStart()),
    streakHistory: [],
  };
}

function buildPlatformBreakdown(
  targets: Array<{
    platform: SocialPlatform;
    status: string;
  }>,
) {
  return platforms.map(platform => {
    const platformTargets = targets.filter(
      target => target.platform === platform,
    );

    return {
      platform,
      total: platformTargets.length,
      published: platformTargets.filter(target => target.status === 'published')
        .length,
      failed: platformTargets.filter(target => target.status === 'failed')
        .length,
    };
  });
}

function buildWeeklyPosts(
  posts: Array<{
    created_at: string;
    status: PostStatus;
    schedule_mode: ScheduleMode;
  }>,
  start: Date,
) {
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + index * 7);

    return {
      weekStart: weekStart.toISOString(),
      posts: 0,
    };
  });

  for (const post of posts) {
    const postWeek = getStartOfWeek(new Date(post.created_at)).toISOString();
    const week = weeks.find(item => item.weekStart === postWeek);

    if (week) {
      week.posts += 1;
    }
  }

  return weeks;
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
  return getStartOfWeek(new Date()).toISOString();
}

function getSixWeekStart() {
  const start = getStartOfWeek(new Date());
  start.setDate(start.getDate() - 5 * 7);
  return start;
}

function getStartOfWeek(input: Date) {
  const date = new Date();
  date.setTime(input.getTime());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
