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
import {
  isAtLeastOneMinuteInFuture,
  parseCreatorScheduledTime,
} from '@/server/scheduling/time';
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
  const draftId = getOptionalString(formData.get('draftId'));
  const scheduleMode = String(formData.get('scheduleMode') ?? 'now');
  const rawScheduledAt = formData.get('scheduledAt');
  const timezone = String(formData.get('timezone') || 'UTC');
  const parsedScheduledTime =
    scheduleMode === 'scheduled'
      ? parseCreatorScheduledTime(
          typeof rawScheduledAt === 'string' ? rawScheduledAt : null,
          timezone,
        )
      : null;

  if (parsedScheduledTime && !parsedScheduledTime.ok) {
    return {
      ok: false,
      message: parsedScheduledTime.message,
    };
  }

  const scheduledAt =
    parsedScheduledTime?.ok === true ? parsedScheduledTime.iso : undefined;

  if (scheduledAt && !isAtLeastOneMinuteInFuture(scheduledAt)) {
    return {
      ok: false,
      message: 'Schedule at least one minute in the future.',
    };
  }

  const rawMediaMetadata = String(formData.get('mediaMetadata') ?? '[]');

  const parsed = composerServerSchema.safeParse({
    body: formData.get('body'),
    platforms,
    scheduleMode,
    scheduledAt,
    timezone,
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

  const postId = draftId ?? randomUUID();
  const targetStatus: PostTargetStatus =
    parsed.data.scheduleMode === 'scheduled' ? 'queued' : 'pending';
  const postStatus =
    parsed.data.scheduleMode === 'scheduled' ? 'scheduled' : 'queued';

  const postError = draftId
    ? await updateOwnedDraftForPublishing({
        draftId,
        userId: user.id,
        body: parsed.data.body,
        postStatus,
        scheduleMode: parsed.data.scheduleMode,
        scheduledAt: parsed.data.scheduledAt ?? null,
        timezone: parsed.data.timezone,
      })
    : (
        await supabase.from('posts').insert({
          id: postId,
          user_id: user.id,
          body: parsed.data.body,
          status: postStatus,
          schedule_mode: parsed.data.scheduleMode,
          scheduled_at: parsed.data.scheduledAt ?? null,
          timezone: parsed.data.timezone,
        })
      ).error;

  if (postError) {
    return {
      ok: false,
      message:
        'Post could not be saved. Confirm database migrations are applied.',
    };
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: postId,
    type: 'post_created',
    title: 'Post draft created',
    message: 'Your post entered the creator queue.',
    metadata: {
      scheduleMode: parsed.data.scheduleMode,
      platforms: parsed.data.platforms,
    },
  });

  const mediaSaveError = await attachUploadedMedia({
    files,
    mediaMetadata: parsed.data.mediaMetadata,
    platforms: parsed.data.platforms,
    postId,
    userId: user.id,
  });

  if (mediaSaveError) {
    return mediaSaveError;
  }

  if (files.length > 0) {
    await supabase.from('activity_events').insert({
      user_id: user.id,
      post_id: postId,
      type: 'media_uploaded',
      title: 'Media uploaded',
      message: `${files.length} asset(s) are ready for platform checks.`,
      metadata: {
        count: files.length,
      },
    });
  }

  const targetRows = parsed.data.platforms.map(platform => ({
    post_id: postId,
    user_id: user.id,
    platform: platform as Platform,
    status: targetStatus,
    platform_body: parsed.data.body,
  }));

  if (draftId) {
    await supabase
      .from('post_platform_targets')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);
  }

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
    idempotency_key: `${postId}:${parsed.data.scheduleMode}:${Date.now()}`,
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
  revalidatePath('/drafts');
  revalidatePath('/schedule');

  return {
    ok: true,
    message:
      parsed.data.scheduleMode === 'scheduled'
        ? 'Post scheduled. The publishing worker will handle it later.'
        : 'Post queued. The publishing worker can pick it up now.',
    postId,
  };
}

export async function saveComposerDraftAction(
  _: ComposerActionState,
  formData: FormData,
): Promise<ComposerActionState> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return {
      ok: false,
      message: 'Sign in with a configured Supabase project before saving drafts.',
    };
  }

  const platforms = formData.getAll('platforms').map(String);
  const draftId = getOptionalString(formData.get('draftId'));
  const timezone = String(formData.get('timezone') || 'UTC');
  const rawMediaMetadata = String(formData.get('mediaMetadata') ?? '[]');

  const parsed = composerServerSchema.safeParse({
    body: formData.get('body'),
    platforms,
    scheduleMode: 'now',
    timezone,
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
  const fileError = validateFiles(files);

  if (fileError) {
    return fileError;
  }

  const postId = draftId ?? randomUUID();

  if (draftId) {
    const { error } = await supabase
      .from('posts')
      .update({
        body: parsed.data.body,
        schedule_mode: 'now',
        scheduled_at: null,
        timezone: parsed.data.timezone,
      })
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('status', 'draft');

    if (error) {
      return {
        ok: false,
        message: 'Draft could not be updated.',
      };
    }
  } else {
    const { error } = await supabase.from('posts').insert({
      id: postId,
      user_id: user.id,
      body: parsed.data.body,
      status: 'draft',
      schedule_mode: 'now',
      scheduled_at: null,
      timezone: parsed.data.timezone,
    });

    if (error) {
      return {
        ok: false,
        message: 'Draft could not be created.',
      };
    }
  }

  const mediaSaveError = await attachUploadedMedia({
    files,
    mediaMetadata: parsed.data.mediaMetadata,
    platforms: parsed.data.platforms,
    postId,
    userId: user.id,
  });

  if (mediaSaveError) {
    return mediaSaveError;
  }

  await supabase
    .from('post_platform_targets')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId);

  const { error: targetError } = await supabase
    .from('post_platform_targets')
    .insert(
      parsed.data.platforms.map(platform => ({
        post_id: postId,
        user_id: user.id,
        platform: platform as Platform,
        status: 'draft' as const,
        platform_body: parsed.data.body,
      })),
    );

  if (targetError) {
    return {
      ok: false,
      message: 'Draft platform targets could not be saved.',
    };
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: postId,
    type: draftId ? 'post_updated' : 'post_created',
    title: draftId ? 'Draft updated' : 'Draft saved',
    message: draftId
      ? 'Your draft changes are saved.'
      : 'Your draft is ready when the idea is.',
    metadata: {
      platforms: parsed.data.platforms,
      status: 'draft',
    },
  });

  revalidatePath('/compose');
  revalidatePath('/drafts');
  revalidatePath('/dashboard');

  return {
    ok: true,
    message: draftId ? 'Draft updated.' : 'Draft saved.',
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

function getOptionalString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validateFiles(files: File[]): ComposerActionState | null {
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

  return null;
}

async function updateOwnedDraftForPublishing({
  draftId,
  userId,
  body,
  postStatus,
  scheduleMode,
  scheduledAt,
  timezone,
}: {
  draftId: string;
  userId: string;
  body: string;
  postStatus: 'queued' | 'scheduled';
  scheduleMode: 'now' | 'scheduled';
  scheduledAt: string | null;
  timezone: string;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return new Error('Supabase is not configured.');
  }

  // Draft sends are state transitions, not blind updates. Restricting by
  // `status = draft` prevents replaying a publish action against a post that
  // already entered the worker queue.
  const { error } = await supabase
    .from('posts')
    .update({
      body,
      status: postStatus,
      schedule_mode: scheduleMode,
      scheduled_at: scheduledAt,
      timezone,
    })
    .eq('id', draftId)
    .eq('user_id', userId)
    .eq('status', 'draft');

  return error;
}

async function attachUploadedMedia({
  files,
  mediaMetadata,
  platforms,
  postId,
  userId,
}: {
  files: File[];
  mediaMetadata: unknown[];
  platforms: Platform[];
  postId: string;
  userId: string;
}): Promise<ComposerActionState | null> {
  if (files.length === 0) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Media upload needs a configured Supabase project.',
    };
  }

  const metadataByName = new Map(
    mediaMetadata
      .map(item => mediaMetadataSchema.safeParse(item))
      .filter(item => item.success)
      .map(item => [item.data.fileName, item.data]),
  );

  const { data: existingLinks } = await supabase
    .from('post_media_assets')
    .select('sort_order')
    .eq('user_id', userId)
    .eq('post_id', postId);
  const startingIndex =
    Math.max(-1, ...(existingLinks ?? []).map(link => link.sort_order)) + 1;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const metadata = metadataByName.get(file.name);
    const extension = getSafeExtension(file.name);
    const storagePath = `${userId}/${postId}/${randomUUID()}${extension}`;

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
        user_id: userId,
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
          selectedPlatforms: platforms,
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
        user_id: userId,
        sort_order: startingIndex + index,
      });

    if (postMediaError) {
      return {
        ok: false,
        message: 'Media could not be attached to the post.',
      };
    }
  }

  return null;
}
