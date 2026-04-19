import type { PostStatus, PostTargetStatus, SocialPlatform } from '@/types/database';

export type DraftPlatformTarget = {
  platform: SocialPlatform;
  status: PostTargetStatus;
  validationWarnings: unknown;
};

export type DraftMediaPreview = {
  id: string;
  kind: 'image' | 'video';
  mimeType: string;
  width: number | null;
  height: number | null;
  signedUrl: string | null;
};

export type DraftListItem = {
  id: string;
  bodyPreview: string;
  body: string;
  status: PostStatus;
  updatedAt: string;
  createdAt: string;
  platforms: DraftPlatformTarget[];
  mediaPreview: DraftMediaPreview | null;
  validationState: 'ready' | 'needs_review';
};

export type DraftsPageData = {
  drafts: DraftListItem[];
  loadedFromSupabase: boolean;
};

export type ComposerDraftDetail = {
  id: string;
  body: string;
  platforms: SocialPlatform[];
  mediaPreviews: DraftMediaPreview[];
};
