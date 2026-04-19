'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type PageRealtimeOptions = {
  enabled: boolean;
  userId: string | null;
  queryKeys: string[][];
};

export function usePageRealtime({
  enabled,
  userId,
  queryKeys,
}: PageRealtimeOptions) {
  const queryClient = useQueryClient();
  const invalidationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const invalidatePages = () => {
      if (invalidationTimer.current) {
        return;
      }

      invalidationTimer.current = setTimeout(() => {
        invalidationTimer.current = null;

        for (const queryKey of queryKeys) {
          void queryClient.invalidateQueries({ queryKey });
        }
      }, 350);
    };

    // These pages care about operational state, not every tiny table. Post,
    // target, job, activity, and streak changes cover schedule movement,
    // publish results, analytics totals, and draft updates without wasteful
    // one-widget subscriptions.
    const channel = supabase
      .channel(`page-foundation:${userId}:${queryKeys.map(key => key[0]).join('-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${userId}`,
        },
        invalidatePages,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_platform_targets',
          filter: `user_id=eq.${userId}`,
        },
        invalidatePages,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'publish_jobs',
          filter: `user_id=eq.${userId}`,
        },
        invalidatePages,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `user_id=eq.${userId}`,
        },
        invalidatePages,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_state',
          filter: `user_id=eq.${userId}`,
        },
        invalidatePages,
      )
      .subscribe();

    return () => {
      if (invalidationTimer.current) {
        clearTimeout(invalidationTimer.current);
        invalidationTimer.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, queryKeys, userId]);
}
