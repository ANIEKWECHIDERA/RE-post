import 'server-only';

import { getServerEnv } from '@/lib/env/server';
import type { SocialPlatform } from '@/types/database';
import { ProviderPublishError } from '@/server/publishing/errors';

export type ProviderPublishInput = {
  platform: SocialPlatform;
  postId: string;
  targetId: string;
  body: string;
  connection: {
    id: string;
    accessToken: string;
    providerAccountId: string;
    scopes: string[];
  } | null;
};

export type ProviderPublishResult = {
  providerPublishId: string;
  providerPermalink: string | null;
  providerRequestId: string | null;
};

export async function publishToProvider(
  input: ProviderPublishInput,
): Promise<ProviderPublishResult> {
  const env = getServerEnv();
  const mode = env?.PUBLISH_PROVIDER_MODE ?? 'disabled';

  if (!input.connection) {
    throw new ProviderPublishError({
      code: 'connection_missing',
      message: `No active ${input.platform} connection is available.`,
      retryable: false,
    });
  }

  if (mode === 'mock') {
    return {
      providerPublishId: `mock_${input.platform}_${input.targetId}`,
      providerPermalink: null,
      providerRequestId: `mock_request_${input.postId}`,
    };
  }

  // Real provider calls are enabled in Phase 7. At this boundary the adapter
  // receives a decrypted token only inside server-only code; no client component
  // or API response receives raw provider credentials.
  throw new ProviderPublishError({
    code: 'provider_adapter_disabled',
    message: `${input.platform} publishing is not enabled yet.`,
    retryable: false,
  });
}
