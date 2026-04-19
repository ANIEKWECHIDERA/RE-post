import type {
  PostStatus,
  PostTargetStatus,
  PublishJobStatus,
  SocialPlatform,
} from '@/types/database';

export type ScheduledPostStatusGroup =
  | 'upcoming'
  | 'processing'
  | 'failed'
  | 'completed';

export type ScheduledPostPlatformTarget = {
  platform: SocialPlatform;
  status: PostTargetStatus;
  providerPermalink: string | null;
  lastErrorMessage: string | null;
};

export type ScheduledPostMediaPreview = {
  id: string;
  kind: 'image' | 'video';
  mimeType: string;
  width: number | null;
  height: number | null;
  signedUrl: string | null;
};

export type ScheduledPostListItem = {
  id: string;
  bodyPreview: string;
  body: string;
  status: PostStatus;
  statusGroup: ScheduledPostStatusGroup;
  scheduledAt: string | null;
  publishedAt: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  platforms: ScheduledPostPlatformTarget[];
  mediaPreview: ScheduledPostMediaPreview | null;
  job: {
    status: PublishJobStatus;
    runAt: string;
    attemptsCount: number;
    lastErrorMessage: string | null;
  } | null;
};

export type ScheduledPostsPageData = {
  posts: ScheduledPostListItem[];
  loadedFromSupabase: boolean;
};
