import 'server-only';

import { ProviderPublishError } from '@/server/publishing/errors';
import { ensureSignedMediaUrl, parseProviderJson } from './http';
import type {
  ProviderMediaAsset,
  ProviderPublishInput,
  ProviderPublishResult,
} from './types';

type LinkedInRegisterUploadResponse = {
  value?: {
    asset?: string;
    uploadMechanism?: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
        uploadUrl?: string;
        headers?: Record<string, string>;
      };
    };
  };
};

const linkedInHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Restli-Protocol-Version': '2.0.0',
};

export async function publishToLinkedIn(
  input: ProviderPublishInput,
): Promise<ProviderPublishResult> {
  if (!input.connection) {
    throw new ProviderPublishError({
      code: 'connection_missing',
      message: 'No active LinkedIn connection is available.',
      retryable: false,
    });
  }

  if (input.body.length > 3000) {
    throw new ProviderPublishError({
      code: 'linkedin_body_too_long',
      message: 'LinkedIn posts must be 3000 characters or fewer.',
      retryable: false,
    });
  }

  const author = normalizeLinkedInAuthor(input.connection.providerAccountId);
  const mediaAssets = await uploadLinkedInMedia({
    accessToken: input.connection.accessToken,
    author,
    media: input.media,
  });
  const shareMediaCategory =
    mediaAssets.length === 0 ? 'NONE' : mediaAssets[0].category;

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      ...linkedInHeaders,
      Authorization: `Bearer ${input.connection.accessToken}`,
    },
    body: JSON.stringify({
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: input.body,
          },
          shareMediaCategory,
          media: mediaAssets.map(asset => ({
            status: 'READY',
            media: asset.asset,
          })),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  if (!response.ok) {
    await parseProviderJson({ provider: 'linkedin', response });
  }

  const providerPublishId = response.headers.get('x-restli-id');

  if (!providerPublishId) {
    throw new ProviderPublishError({
      code: 'linkedin_missing_publish_id',
      message: 'LinkedIn published the request without returning a post id.',
      retryable: true,
    });
  }

  return {
    providerPublishId,
    providerPermalink: `https://www.linkedin.com/feed/update/${providerPublishId}`,
    providerRequestId: response.headers.get('x-li-uuid'),
  };
}

async function uploadLinkedInMedia({
  accessToken,
  author,
  media,
}: {
  accessToken: string;
  author: string;
  media: ProviderMediaAsset[];
}) {
  const uploaded: Array<{ asset: string; category: 'IMAGE' | 'VIDEO' }> = [];

  for (const asset of media) {
    if (asset.kind !== 'image') {
      throw new ProviderPublishError({
        code: 'linkedin_video_pending',
        message:
          'LinkedIn video publishing needs the provider video processing flow before it can go live.',
        retryable: false,
      });
    }

    const signedUrl = ensureSignedMediaUrl({
      signedUrl: asset.signedUrl,
      platform: 'linkedin',
    });
    const registered = await registerLinkedInImageUpload({
      accessToken,
      author,
    });
    await uploadLinkedInBinary({
      accessToken,
      uploadUrl: registered.uploadUrl,
      sourceUrl: signedUrl,
      mimeType: asset.mimeType,
    });
    uploaded.push({
      asset: registered.asset,
      category: 'IMAGE',
    });
  }

  return uploaded;
}

async function registerLinkedInImageUpload({
  accessToken,
  author,
}: {
  accessToken: string;
  author: string;
}) {
  const response = await fetch(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      method: 'POST',
      headers: {
        ...linkedInHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: author,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    },
  );
  const payload = await parseProviderJson<LinkedInRegisterUploadResponse>({
    provider: 'linkedin',
    response,
  });
  const upload =
    payload.value?.uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ];

  if (!payload.value?.asset || !upload?.uploadUrl) {
    throw new ProviderPublishError({
      code: 'linkedin_upload_registration_incomplete',
      message: 'LinkedIn did not return a complete media upload target.',
      retryable: true,
    });
  }

  return {
    asset: payload.value.asset,
    uploadUrl: upload.uploadUrl,
  };
}

async function uploadLinkedInBinary({
  accessToken,
  uploadUrl,
  sourceUrl,
  mimeType,
}: {
  accessToken: string;
  uploadUrl: string;
  sourceUrl: string;
  mimeType: string;
}) {
  const mediaResponse = await fetch(sourceUrl);

  if (!mediaResponse.ok) {
    throw new ProviderPublishError({
      code: 'linkedin_media_download_failed',
      message: 'The media asset could not be prepared for LinkedIn upload.',
      retryable: true,
    });
  }

  // LinkedIn's upload URL expects the binary body. Keeping the download/upload
  // inside the server means the provider never receives Supabase credentials.
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: await mediaResponse.arrayBuffer(),
  });

  if (!response.ok) {
    await parseProviderJson({ provider: 'linkedin', response });
  }
}

function normalizeLinkedInAuthor(providerAccountId: string) {
  return providerAccountId.startsWith('urn:li:')
    ? providerAccountId
    : `urn:li:person:${providerAccountId}`;
}
