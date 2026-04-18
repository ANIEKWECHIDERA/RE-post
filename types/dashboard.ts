import type { ActivityEventType } from "@/types/database";

export type DashboardActivityItem = {
  id: string;
  type: ActivityEventType;
  title: string;
  message: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  currentStreak: number;
  longestStreak: number;
  postsThisWeek: number;
  scheduledPosts: number;
  connectedPlatforms: number;
  recentActivity: DashboardActivityItem[];
  loadedFromSupabase: boolean;
};
