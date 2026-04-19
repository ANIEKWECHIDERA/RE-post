import 'server-only';

import { emptyDashboardSummary, getDashboardSummary } from '@/server/dashboard/queries';
import type { AnalyticsPageData } from '@/types/analytics';

export const emptyAnalyticsPageData: AnalyticsPageData = {
  analytics: emptyDashboardSummary.analytics,
  currentStreak: 0,
  longestStreak: 0,
  streakStatus: emptyDashboardSummary.streakStatus,
  recentActivity: [],
  loadedFromSupabase: false,
  engagementMetricsLive: false,
};

export async function getAnalyticsPageData(
  userId: string,
): Promise<AnalyticsPageData> {
  const summary = await getDashboardSummary(userId);

  return {
    analytics: summary.analytics,
    currentStreak: summary.currentStreak,
    longestStreak: summary.longestStreak,
    streakStatus: summary.streakStatus,
    recentActivity: summary.recentActivity,
    loadedFromSupabase: summary.loadedFromSupabase,
    // Provider-side impressions, clicks, comments, and follower deltas require
    // live provider APIs. Phase 1 intentionally reports only internal publish
    // analytics and keeps external engagement clearly marked as pending.
    engagementMetricsLive: false,
  };
}
