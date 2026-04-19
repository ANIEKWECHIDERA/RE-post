import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  ImagePlus,
  Link2,
  RefreshCcw,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import type { ActivityEventType, Json } from '@/types/database';

export type ActivityTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'streak'
  | 'system';

export type ActivityPresentation = {
  icon: LucideIcon;
  tone: ActivityTone;
  label: string;
  status: string;
};

export function getActivityPresentation(
  type: ActivityEventType,
): ActivityPresentation {
  switch (type) {
    case 'profile_bootstrapped':
      return {
        icon: Sparkles,
        tone: 'system',
        label: 'Workspace',
        status: 'Ready',
      };
    case 'social_connection_created':
    case 'social_connection_updated':
      return {
        icon: Link2,
        tone: 'system',
        label: 'Connection',
        status: 'Updated',
      };
    case 'media_uploaded':
    case 'media_validated':
      return {
        icon: ImagePlus,
        tone: 'neutral',
        label: 'Media',
        status: 'Prepared',
      };
    case 'post_created':
    case 'post_updated':
      return {
        icon: Send,
        tone: 'neutral',
        label: 'Post',
        status: 'Updated',
      };
    case 'post_scheduled':
      return {
        icon: CalendarClock,
        tone: 'system',
        label: 'Schedule',
        status: 'Queued',
      };
    case 'publish_queued':
    case 'publish_started':
      return {
        icon: Clock3,
        tone: 'neutral',
        label: 'Publish',
        status: 'Running',
      };
    case 'publish_succeeded':
      return {
        icon: CheckCircle2,
        tone: 'success',
        label: 'Publish',
        status: 'Live',
      };
    case 'publish_failed':
      return {
        icon: AlertCircle,
        tone: 'danger',
        label: 'Publish',
        status: 'Failed',
      };
    case 'retry_scheduled':
      return {
        icon: RefreshCcw,
        tone: 'warning',
        label: 'Retry',
        status: 'Scheduled',
      };
    case 'streak_updated':
      return {
        icon: Flame,
        tone: 'streak',
        label: 'Streak',
        status: 'Updated',
      };
    default:
      return {
        icon: Sparkles,
        tone: 'neutral',
        label: 'Activity',
        status: 'New',
      };
  }
}

export function getActivityToneClasses(tone: ActivityTone) {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'danger':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'streak':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'system':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function getActivityMetadataLabel(metadata: Json) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const platform = metadata.platform;
  const eventType = metadata.eventType;
  const newCount = metadata.newCount;
  const count = metadata.count;

  if (typeof platform === 'string') {
    return platform;
  }

  if (typeof eventType === 'string' && typeof newCount === 'number') {
    return `${eventType} to ${newCount}`;
  }

  if (typeof count === 'number') {
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  return null;
}
