import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/types/dashboard";

export const emptyDashboardSummary: DashboardSummary = {
  currentStreak: 0,
  longestStreak: 0,
  postsThisWeek: 0,
  scheduledPosts: 0,
  connectedPlatforms: 0,
  recentActivity: [],
  loadedFromSupabase: false,
};

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
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
    connectedPlatformsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from("streak_state")
      .select("current_count,longest_count")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfWeek),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .gte("scheduled_at", now),
    supabase
      .from("social_connections")
      .select("platform", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("activity_events")
      .select("id,type,title,message,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (
    streakResult.error ||
    postsThisWeekResult.error ||
    scheduledPostsResult.error ||
    connectedPlatformsResult.error ||
    activityResult.error
  ) {
    return emptyDashboardSummary;
  }

  return {
    currentStreak: streakResult.data?.current_count ?? 0,
    longestStreak: streakResult.data?.longest_count ?? 0,
    postsThisWeek: postsThisWeekResult.count ?? 0,
    scheduledPosts: scheduledPostsResult.count ?? 0,
    connectedPlatforms: connectedPlatformsResult.count ?? 0,
    recentActivity:
      activityResult.data?.map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        message: event.message,
        createdAt: event.created_at,
      })) ?? [],
    loadedFromSupabase: true,
  };
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
