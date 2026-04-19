import 'server-only';

import { ProviderPublishError } from '@/server/publishing/errors';

type ProviderName = 'linkedin' | 'facebook' | 'instagram';

export async function parseProviderJson<T>({
  provider,
  response,
}: {
  provider: ProviderName;
  response: Response;
}): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & {
        error?: {
          code?: string | number;
          type?: string;
          message?: string;
        };
      })
    | null;

  if (!response.ok) {
    throw normalizeHttpProviderError({ provider, response, payload });
  }

  return payload as T;
}

export function normalizeHttpProviderError({
  provider,
  response,
  payload,
}: {
  provider: ProviderName;
  response: Response;
  payload: {
    error?: {
      code?: string | number;
      type?: string;
    };
  } | null;
}) {
  const providerCode = payload?.error?.code ?? response.status;
  const errorType = payload?.error?.type ? `_${payload.error.type}` : '';

  return new ProviderPublishError({
    code: `${provider}_${providerCode}${errorType}`.toLowerCase(),
    message:
      response.status === 401 || response.status === 403
        ? `${provider} rejected the connection permissions. Reconnect the account and try again.`
        : `${provider} could not publish this post right now.`,
    retryable: response.status === 429 || response.status >= 500,
  });
}

export function ensureSingleMediaKind({
  mediaCount,
  platform,
}: {
  mediaCount: number;
  platform: ProviderName;
}) {
  if (mediaCount > 1) {
    throw new ProviderPublishError({
      code: `${platform}_multi_media_pending`,
      message: `${platform} multi-media publishing is not enabled in this adapter yet.`,
      retryable: false,
    });
  }
}

export function ensureSignedMediaUrl({
  signedUrl,
  platform,
}: {
  signedUrl: string | null;
  platform: ProviderName;
}) {
  if (!signedUrl) {
    throw new ProviderPublishError({
      code: `${platform}_media_url_unavailable`,
      message:
        'The media asset is not available through a temporary publishing URL.',
      retryable: true,
    });
  }

  return signedUrl;
}
