'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DashboardSummary } from '@/types/dashboard';
import type { ActivityEventType, Json } from '@/types/database';

type DashboardRealtimeOptions = {
  enabled: boolean;
  userId: string | null;
};

type RealtimeActivityEvent = {
  id: string;
  user_id: string;
  type: ActivityEventType;
  title: string;
  message: string | null;
  metadata: Json;
  created_at: string;
};

export function useDashboardRealtime({
  enabled,
  userId,
}: DashboardRealtimeOptions) {
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

    const invalidateDashboard = () => {
      if (invalidationTimer.current) {
        return;
      }

      invalidationTimer.current = setTimeout(() => {
        invalidationTimer.current = null;
        void queryClient.invalidateQueries({
          queryKey: ['dashboard-summary'],
        });
      }, 350);
    };

    const pushActivityEvent = (event: RealtimeActivityEvent) => {
      queryClient.setQueryData<DashboardSummary>(
        ['dashboard-summary'],
        current => {
          if (!current) {
            return current;
          }

          const nextActivity = [
            {
              id: event.id,
              type: event.type,
              title: event.title,
              message: event.message,
              metadata: event.metadata,
              createdAt: event.created_at,
            },
            ...current.recentActivity.filter(item => item.id !== event.id),
          ].slice(0, 12);

          return {
            ...current,
            recentActivity: nextActivity,
          };
        },
      );

      notifyPublishActivity(event);
    };

    // Keep the home screen live with only high-signal tables. Activity events
    // are the narrative source; target/post/streak updates refresh the summary
    // without opening one subscription per widget.
    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          pushActivityEvent(payload.new as RealtimeActivityEvent);
          invalidateDashboard();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streak_state',
          filter: `user_id=eq.${userId}`,
        },
        invalidateDashboard,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'post_platform_targets',
          filter: `user_id=eq.${userId}`,
        },
        invalidateDashboard,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${userId}`,
        },
        invalidateDashboard,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_connections',
          filter: `user_id=eq.${userId}`,
        },
        invalidateDashboard,
      )
      .subscribe();

    return () => {
      if (invalidationTimer.current) {
        clearTimeout(invalidationTimer.current);
        invalidationTimer.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, userId]);
}

function notifyPublishActivity(event: RealtimeActivityEvent) {
  if (event.type === 'publish_succeeded') {
    toast.success(event.title, {
      description: event.message ?? 'The platform accepted the post.',
    });
    return;
  }

  if (event.type === 'publish_failed') {
    toast.error(event.title, {
      description: event.message ?? 'The platform rejected the post.',
    });
    return;
  }

  if (event.type === 'retry_scheduled') {
    toast.warning(event.title, {
      description: event.message ?? 'RE-post will retry the platform publish.',
    });
  }
}
