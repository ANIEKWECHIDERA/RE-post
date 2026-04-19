'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/fetch/api-client';
import type { ScheduledPostsPageData } from '@/types/scheduled-posts';

export function useScheduledPosts(initialData: ScheduledPostsPageData) {
  return useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: () => apiFetch<ScheduledPostsPageData>('/api/scheduled-posts'),
    initialData,
    staleTime: 15_000,
  });
}
