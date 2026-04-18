"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/fetch/api-client";
import type { DashboardSummary } from "@/types/dashboard";

export function useDashboardSummary(initialData: DashboardSummary) {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
    initialData,
    staleTime: 15_000,
  });
}
