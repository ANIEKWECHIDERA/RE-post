import 'server-only';

import type { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ProviderMediaAsset } from '@/server/publishing/adapters/types';

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export async function getProviderMediaAssets({
  postId,
  userId,
  supabase,
}: {
  postId: string;
  userId: string;
  supabase: AdminClient;
}): Promise<ProviderMediaAsset[]> {
  const { data: links } = await supabase
    .from('post_media_assets')
    .select('media_asset_id,sort_order')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .order('sort_order', { ascending: true });

  const mediaIds = links?.map(link => link.media_asset_id) ?? [];

  if (mediaIds.length === 0) {
    return [];
  }

  const { data: rows } = await supabase
    .from('media_assets')
    .select(
      'id,storage_path,mime_type,byte_size,kind,width,height,aspect_ratio,duration_seconds,status',
    )
    .eq('user_id', userId)
    .in('id', mediaIds);

  const rowsById = new Map((rows ?? []).map(row => [row.id, row]));
  const orderedRows = mediaIds
    .map(id => rowsById.get(id))
    .filter(row => row?.status === 'ready');
  const signedAssets = await Promise.all(
    orderedRows.map(async row => {
      if (!row) {
        return null;
      }

      const { data } = await supabase.storage
        .from('post-media')
        .createSignedUrl(row.storage_path, 60 * 60);

      return {
        id: row.id,
        kind: row.kind,
        mimeType: row.mime_type,
        byteSize: row.byte_size,
        width: row.width,
        height: row.height,
        aspectRatio: row.aspect_ratio,
        durationSeconds: row.duration_seconds,
        storagePath: row.storage_path,
        signedUrl: data?.signedUrl ?? null,
      } satisfies ProviderMediaAsset;
    }),
  );

  return signedAssets.filter((asset): asset is ProviderMediaAsset => Boolean(asset));
}
