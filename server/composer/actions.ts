'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  acceptedMediaMimeTypes,
  maxMediaFileSize,
  mediaMetadataSchema,
} from '@/schemas/media';
import { composerServerSchema } from '@/schemas/post';
import type { Platform } from '@/schemas/platform';
import { getCurrentUser } from '@/server/auth/session';
import type { PostTargetStatus } from '@/types/database';

export type ComposerActionState = {
  ok: boolean;
  message: string;
  postId?: string;
};

const initialError = 'We could not save that post. Try again in a moment.';

export async function createComposerPostAction(
  _: ComposerActionState,
  formData: FormData,
): Promise<ComposerActionState> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return {
      ok: false,
      message:
        'Sign in with a configured Supabase project before creating posts.',
    };
  }

  const platforms = formData.getAll('platforms').map(String);
  const scheduleMode = String(formData.get('scheduleMode') ?? 'now');
  const rawScheduledAt = formData.get('scheduledAt');
  const scheduledAt =
    typeof rawScheduledAt === 'string' && rawScheduledAt
      ? new Date(rawScheduledAt).toISOString()
      : undefined;
  const rawMediaMetadata = String(formData.get('mediaMetadata') ?? '[]');

  const parsed = composerServerSchema.safeParse({
    body: formData.get('body'),
    platforms,
    scheduleMode,
    scheduledAt,
    timezone: formData.get('timezone') || 'UTC',
    mediaMetadata: safeJsonParse(rawMediaMetadata),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? initialError,
    };
  }

  const files = formData
    .getAll('media')
    .filter((item): item is File => item instanceof File && item.size > 0);

  for (const file of files) {
    if (
      !acceptedMediaMimeTypes.includes(
        file.type as (typeof acceptedMediaMimeTypes)[number],
      )
    ) {
      return {
        ok: false,
        message: `${file.name} uses an unsupported media type.`,
      };
    }

    if (file.size > maxMediaFileSize) {
      return {
        ok: false,
        message: `${file.name} is over the 100 MB upload limit.`,
      };
    }
  }

  const postId = randomUUID();
  const targetStatus: PostTargetStatus =
    parsed.data.scheduleMode === 'scheduled' ? 'queued' : 'pending';
  const postStatus =
    parsed.data.scheduleMode === 'scheduled' ? 'scheduled' : 'queued';

  const { error: postError } = await supabase.from('posts').insert({
    id: postId,
    user_id: user.id,
    body: parsed.data.body,
    status: postStatus,
    schedule_mode: parsed.data.scheduleMode,
    scheduled_at: parsed.data.scheduledAt ?? null,
    timezone: parsed.data.timezone,
  });

  if (postError) {
    return {
      ok: false,
      message:
        'Post could not be saved. Confirm the Phase 2 migrations are applied.',
    };
  }

  const metadataByName = new Map(
    parsed.data.mediaMetadata
      .map(item => mediaMetadataSchema.safeParse(item))
      .filter(item => item.success)
      .map(item => [item.data.fileName, item.data]),
  );

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const metadata = metadataByName.get(file.name);
    const extension = getSafeExtension(file.name);
    const storagePath = `${user.id}/${postId}/${randomUUID()}${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        ok: false,
        message:
          'Media upload failed. Confirm the private post-media bucket exists.',
      };
    }

    const { data: mediaRow, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        byte_size: file.size,
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        width: metadata?.width ?? null,
        height: metadata?.height ?? null,
        duration_seconds: metadata?.durationSeconds ?? null,
        aspect_ratio: metadata?.aspectRatio ?? null,
        status: 'ready',
        validation_warnings: metadata?.warnings ?? [],
        metadata: {
          selectedPlatforms: parsed.data.platforms,
        },
      })
      .select('id')
      .single();

    if (mediaError || !mediaRow) {
      return {
        ok: false,
        message: 'Media metadata could not be saved.',
      };
    }

    const { error: postMediaError } = await supabase
      .from('post_media_assets')
      .insert({
        post_id: postId,
        media_asset_id: mediaRow.id,
        user_id: user.id,
        sort_order: index,
      });

    if (postMediaError) {
      return {
        ok: false,
        message: 'Media could not be attached to the post.',
      };
    }
  }

  const targetRows = parsed.data.platforms.map(platform => ({
    post_id: postId,
    user_id: user.id,
    platform: platform as Platform,
    status: targetStatus,
    platform_body: parsed.data.body,
  }));

  const { error: targetError } = await supabase
    .from('post_platform_targets')
    .insert(targetRows);

  if (targetError) {
    return {
      ok: false,
      message: 'Platform targets could not be saved.',
    };
  }

  const { error: jobError } = await supabase.from('publish_jobs').insert({
    user_id: user.id,
    post_id: postId,
    status: 'queued',
    run_at: parsed.data.scheduledAt ?? new Date().toISOString(),
    idempotency_key: `${postId}:${parsed.data.scheduleMode}`,
  });

  if (jobError) {
    return {
      ok: false,
      message: 'Publish job could not be queued.',
    };
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: postId,
    type:
      parsed.data.scheduleMode === 'scheduled'
        ? 'post_scheduled'
        : 'publish_queued',
    title:
      parsed.data.scheduleMode === 'scheduled'
        ? 'Post scheduled'
        : 'Post queued',
    message:
      parsed.data.scheduleMode === 'scheduled'
        ? 'Your post is waiting for its scheduled time.'
        : 'Your post is queued for the publishing engine.',
  });

  revalidatePath('/dashboard');
  revalidatePath('/compose');

  return {
    ok: true,
    message:
      parsed.data.scheduleMode === 'scheduled'
        ? 'Post scheduled. The publishing worker will handle it later.'
        : 'Post queued. The publishing worker can pick it up now.',
    postId,
  };
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}

function getSafeExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}
