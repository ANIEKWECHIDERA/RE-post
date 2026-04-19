import 'server-only';

import type { Json, MediaKind, SocialPlatform } from '@/types/database';

export type ProviderMediaAsset = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  durationSeconds: number | null;
  storagePath: string;
  signedUrl: string | null;
};

export type ProviderConnection = {
  id: string;
  accessToken: string;
  providerAccountId: string;
  scopes: string[];
  metadata: Json;
};

export type ProviderPublishInput = {
  platform: SocialPlatform;
  postId: string;
  targetId: string;
  body: string;
  connection: ProviderConnection | null;
  media: ProviderMediaAsset[];
};

export type ProviderPublishResult = {
  providerPublishId: string;
  providerPermalink: string | null;
  providerRequestId: string | null;
};
