'use client';

import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/fetch/api-client';
import type { DraftsPageData } from '@/types/drafts';

export function useDrafts(initialData: DraftsPageData) {
  return useQuery({
    queryKey: ['drafts'],
    queryFn: () => apiFetch<DraftsPageData>('/api/drafts'),
    initialData,
    staleTime: 15_000,
  });
}
