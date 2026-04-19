import type {
  ActivityEventType,
  Json,
  PostStatus,
  SocialPlatform,
} from '@/types/database';
import type { StreakStatus } from '@/types/streaks';

export type AnalyticsPlatformItem = {
  platform: SocialPlatform;
  total: number;
  published: number;
  failed: number;
};

export type AnalyticsWeekItem = {
  weekStart: string;
  posts: number;
};

export type AnalyticsStreakHistoryItem = {
  date: string;
  type: string;
  count: number;
};

export type DashboardAnalyticsSummary = {
  totalPosts: number;
  instantPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  successfulTargets: number;
  failedTargets: number;
  publishSuccessRate: number;
  platformBreakdown: AnalyticsPlatformItem[];
  weeklyPosts: AnalyticsWeekItem[];
  streakHistory: AnalyticsStreakHistoryItem[];
};

export type DashboardActivityItem = {
  id: string;
  type: ActivityEventType;
  title: string;
  message: string | null;
  metadata: Json;
  createdAt: string;
};

export type ScheduledPostQueueItem = {
  id: string;
  bodyPreview: string;
  scheduledAt: string;
  timezone: string;
  status: PostStatus;
  platforms: SocialPlatform[];
};

export type DashboardSummary = {
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  postsThisWeek: number;
  scheduledPosts: number;
  connectedPlatforms: number;
  recentActivity: DashboardActivityItem[];
  scheduledQueue: ScheduledPostQueueItem[];
  analytics: DashboardAnalyticsSummary;
  loadedFromSupabase: boolean;
};
