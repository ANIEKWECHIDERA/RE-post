import 'server-only';

import { ProviderPublishError } from '@/server/publishing/errors';
import {
  ensureSignedMediaUrl,
  ensureSingleMediaKind,
  parseProviderJson,
} from './http';
import type { ProviderPublishInput, ProviderPublishResult } from './types';

const META_GRAPH_BASE = 'https://graph.facebook.com/v24.0';

type FacebookPostResponse = {
  id?: string;
  post_id?: string;
};

export async function publishToFacebook(
  input: ProviderPublishInput,
): Promise<ProviderPublishResult> {
  if (!input.connection) {
    throw new ProviderPublishError({
      code: 'connection_missing',
      message: 'No active Facebook connection is available.',
      retryable: false,
    });
  }

  ensureFacebookPageConnection(input);
  ensureSingleMediaKind({
    mediaCount: input.media.length,
    platform: 'facebook',
  });

  if (input.media.length === 0) {
    return publishFacebookFeedPost(input);
  }

  const [asset] = input.media;

  if (asset.kind !== 'image') {
    throw new ProviderPublishError({
      code: 'facebook_video_pending',
      message:
        'Facebook video publishing needs the Graph Video API upload flow before it can go live.',
      retryable: false,
    });
  }

  return publishFacebookPhotoPost(input, ensureSignedMediaUrl({
    signedUrl: asset.signedUrl,
    platform: 'facebook',
  }));
}

async function publishFacebookFeedPost(
  input: ProviderPublishInput,
): Promise<ProviderPublishResult> {
  const response = await fetch(
    `${META_GRAPH_BASE}/${input.connection?.providerAccountId}/feed`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.connection?.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message: input.body,
      }),
    },
  );
  const payload = await parseProviderJson<FacebookPostResponse>({
    provider: 'facebook',
    response,
  });
  const providerPublishId = payload.id;

  if (!providerPublishId) {
    throw new ProviderPublishError({
      code: 'facebook_missing_publish_id',
      message: 'Facebook published the request without returning a post id.',
      retryable: true,
    });
  }

  return {
    providerPublishId,
    providerPermalink: `https://www.facebook.com/${providerPublishId.replace('_', '/posts/')}`,
    providerRequestId: response.headers.get('x-fb-trace-id'),
  };
}

async function publishFacebookPhotoPost(
  input: ProviderPublishInput,
  mediaUrl: string,
): Promise<ProviderPublishResult> {
  const response = await fetch(
    `${META_GRAPH_BASE}/${input.connection?.providerAccountId}/photos`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.connection?.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        url: mediaUrl,
        caption: input.body,
        published: 'true',
      }),
    },
  );
  const payload = await parseProviderJson<FacebookPostResponse>({
    provider: 'facebook',
    response,
  });
  const providerPublishId = payload.post_id ?? payload.id;

  if (!providerPublishId) {
    throw new ProviderPublishError({
      code: 'facebook_missing_photo_id',
      message: 'Facebook published the photo without returning an id.',
      retryable: true,
    });
  }

  return {
    providerPublishId,
    providerPermalink: `https://www.facebook.com/${providerPublishId.replace('_', '/posts/')}`,
    providerRequestId: response.headers.get('x-fb-trace-id'),
  };
}

function ensureFacebookPageConnection(input: ProviderPublishInput) {
  const metadata = input.connection?.metadata;
  const profileKind =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata.profileKind
      : null;

  if (profileKind !== 'facebook_page') {
    throw new ProviderPublishError({
      code: 'facebook_page_selection_required',
      message:
        'Choose a Facebook Page before publishing. User profile tokens cannot publish Page posts.',
      retryable: false,
    });
  }
}
