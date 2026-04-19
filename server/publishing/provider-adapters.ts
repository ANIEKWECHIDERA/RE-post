import 'server-only';

import { getServerEnv } from '@/lib/env/server';
import { ProviderPublishError } from '@/server/publishing/errors';
import { publishToFacebook } from '@/server/publishing/adapters/facebook';
import { publishToInstagram } from '@/server/publishing/adapters/instagram';
import { publishToLinkedIn } from '@/server/publishing/adapters/linkedin';
import type {
  ProviderPublishInput,
  ProviderPublishResult,
} from '@/server/publishing/adapters/types';

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

  if (mode !== 'live') {
    throw new ProviderPublishError({
      code: 'provider_adapter_disabled',
      message: `${input.platform} publishing is not enabled yet.`,
      retryable: false,
    });
  }

  switch (input.platform) {
    case 'linkedin':
      return publishToLinkedIn(input);
    case 'facebook':
      return publishToFacebook(input);
    case 'instagram':
      return publishToInstagram(input);
  }
}
