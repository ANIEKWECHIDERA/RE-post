import type {
  ActivityEventType,
  PostStatus,
  SocialPlatform,
} from '@/types/database';

export type DashboardActivityItem = {
  id: string;
  type: ActivityEventType;
  title: string;
  message: string | null;
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
  postsThisWeek: number;
  scheduledPosts: number;
  connectedPlatforms: number;
  recentActivity: DashboardActivityItem[];
  scheduledQueue: ScheduledPostQueueItem[];
  loadedFromSupabase: boolean;
};
