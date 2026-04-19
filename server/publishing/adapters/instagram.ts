import 'server-only';

import { ProviderPublishError } from '@/server/publishing/errors';
import {
  ensureSignedMediaUrl,
  ensureSingleMediaKind,
  parseProviderJson,
} from './http';
import type { ProviderPublishInput, ProviderPublishResult } from './types';

const META_GRAPH_BASE = 'https://graph.facebook.com/v24.0';

type InstagramContainerResponse = {
  id?: string;
};

type InstagramPublishResponse = {
  id?: string;
};

type InstagramMediaResponse = {
  permalink?: string;
};

export async function publishToInstagram(
  input: ProviderPublishInput,
): Promise<ProviderPublishResult> {
  if (!input.connection) {
    throw new ProviderPublishError({
      code: 'connection_missing',
      message: 'No active Instagram connection is available.',
      retryable: false,
    });
  }

  ensureInstagramProfessionalConnection(input);
  ensureSingleMediaKind({
    mediaCount: input.media.length,
    platform: 'instagram',
  });

  if (input.media.length === 0) {
    throw new ProviderPublishError({
      code: 'instagram_media_required',
      message: 'Instagram publishing requires an image or video asset.',
      retryable: false,
    });
  }

  const [asset] = input.media;

  if (asset.kind !== 'image') {
    throw new ProviderPublishError({
      code: 'instagram_video_pending',
      message:
        'Instagram video publishing needs the Graph video container status flow before it can go live.',
      retryable: false,
    });
  }

  const imageUrl = ensureSignedMediaUrl({
    signedUrl: asset.signedUrl,
    platform: 'instagram',
  });
  const containerId = await createInstagramImageContainer(input, imageUrl);
  const published = await publishInstagramContainer(input, containerId);
  const permalink = await getInstagramPermalink(input, published.id ?? null);

  if (!published.id) {
    throw new ProviderPublishError({
      code: 'instagram_missing_publish_id',
      message: 'Instagram published the request without returning a media id.',
      retryable: true,
    });
  }

  return {
    providerPublishId: published.id,
    providerPermalink: permalink,
    providerRequestId: containerId,
  };
}

async function createInstagramImageContainer(
  input: ProviderPublishInput,
  imageUrl: string,
) {
  const response = await fetch(
    `${META_GRAPH_BASE}/${input.connection?.providerAccountId}/media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.connection?.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption: input.body,
      }),
    },
  );
  const payload = await parseProviderJson<InstagramContainerResponse>({
    provider: 'instagram',
    response,
  });

  if (!payload.id) {
    throw new ProviderPublishError({
      code: 'instagram_missing_container_id',
      message: 'Instagram did not return a media container id.',
      retryable: true,
    });
  }

  return payload.id;
}

async function publishInstagramContainer(
  input: ProviderPublishInput,
  containerId: string,
) {
  const response = await fetch(
    `${META_GRAPH_BASE}/${input.connection?.providerAccountId}/media_publish`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.connection?.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: containerId,
      }),
    },
  );

  return parseProviderJson<InstagramPublishResponse>({
    provider: 'instagram',
    response,
  });
}

async function getInstagramPermalink(
  input: ProviderPublishInput,
  mediaId: string | null,
) {
  if (!mediaId) {
    return null;
  }

  const url = new URL(`${META_GRAPH_BASE}/${mediaId}`);
  url.searchParams.set('fields', 'permalink');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.connection?.accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await parseProviderJson<InstagramMediaResponse>({
    provider: 'instagram',
    response,
  });

  return payload.permalink ?? null;
}

function ensureInstagramProfessionalConnection(input: ProviderPublishInput) {
  const metadata = input.connection?.metadata;
  const profileKind =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata.profileKind
      : null;

  if (profileKind !== 'instagram_professional') {
    throw new ProviderPublishError({
      code: 'instagram_professional_account_required',
      message:
        'Connect an Instagram professional account through Meta before publishing.',
      retryable: false,
    });
  }
}
