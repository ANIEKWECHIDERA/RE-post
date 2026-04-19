import type {
  DashboardActivityItem,
  DashboardAnalyticsSummary,
} from '@/types/dashboard';
import type { StreakStatus } from '@/types/streaks';

export type AnalyticsPageData = {
  analytics: DashboardAnalyticsSummary;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  recentActivity: DashboardActivityItem[];
  loadedFromSupabase: boolean;
  engagementMetricsLive: boolean;
};
