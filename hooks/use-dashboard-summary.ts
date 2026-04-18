"use client";

import { useQuery } from "@tanstack/react-query";

type DashboardSummary = {
  currentStreak: number;
  postsThisWeek: number;
  scheduledPosts: number;
  connectedPlatforms: number;
};

const phaseOneSummary: DashboardSummary = {
  currentStreak: 7,
  postsThisWeek: 4,
  scheduledPosts: 3,
  connectedPlatforms: 0,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary", "phase-1"],
    queryFn: async () => phaseOneSummary,
  });
}
