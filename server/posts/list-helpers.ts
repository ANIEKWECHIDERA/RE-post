import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export function getBodyPreview(body: string, maxLength = 120) {
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

export async function getFirstMediaPreviews(
  userId: string,
  postIds: string[],
) {
  if (postIds.length === 0) {
    return new Map<
      string,
      {
        id: string;
        kind: 'image' | 'video';
        mimeType: string;
        width: number | null;
        height: number | null;
        signedUrl: string | null;
      }
    >();
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return new Map();
  }

  const { data: joins } = await supabase
    .from('post_media_assets')
    .select('post_id,media_asset_id,sort_order')
    .eq('user_id', userId)
    .in('post_id', postIds)
    .order('sort_order', { ascending: true });

  const firstMediaByPost = new Map<string, string>();

  for (const join of joins ?? []) {
    if (!firstMediaByPost.has(join.post_id)) {
      firstMediaByPost.set(join.post_id, join.media_asset_id);
    }
  }

  const mediaIds = [...new Set(firstMediaByPost.values())];

  if (mediaIds.length === 0) {
    return new Map();
  }

  const { data: mediaRows } = await supabase
    .from('media_assets')
    .select('id,storage_path,mime_type,kind,width,height')
    .eq('user_id', userId)
    .in('id', mediaIds);

  const mediaById = new Map(
    (mediaRows ?? []).map(row => [
      row.id,
      {
        id: row.id,
        kind: row.kind,
        mimeType: row.mime_type,
        width: row.width,
        height: row.height,
        storagePath: row.storage_path,
      },
    ]),
  );

  const previewsByPost = new Map<
    string,
    {
      id: string;
      kind: 'image' | 'video';
      mimeType: string;
      width: number | null;
      height: number | null;
      signedUrl: string | null;
    }
  >();

  for (const [postId, mediaId] of firstMediaByPost.entries()) {
    const media = mediaById.get(mediaId);

    if (!media) {
      continue;
    }

    // Media buckets are private. The page only receives a short-lived signed
    // URL for the first preview asset, never the raw storage path as an
    // authorization primitive.
    const { data: signed } = await supabase.storage
      .from('post-media')
      .createSignedUrl(media.storagePath, 60 * 10);

    previewsByPost.set(postId, {
      id: media.id,
      kind: media.kind,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      signedUrl: signed?.signedUrl ?? null,
    });
  }

  return previewsByPost;
}
