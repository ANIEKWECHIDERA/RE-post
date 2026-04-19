'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/fetch/api-client';
import type { AnalyticsPageData } from '@/types/analytics';

export function useAnalyticsPage(initialData: AnalyticsPageData) {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => apiFetch<AnalyticsPageData>('/api/analytics/summary'),
    initialData,
    staleTime: 15_000,
  });
}
