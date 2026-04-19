'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { draftIdSchema } from '@/schemas/drafts';
import { getCurrentUser } from '@/server/auth/session';

export async function deleteDraftAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const parsed = draftIdSchema.safeParse({
    draftId: formData.get('draftId'),
  });

  if (!user || !supabase || !parsed.success) {
    return;
  }

  // Hard-delete is allowed only while the row is still a draft owned by the
  // current user. Once a post enters the queue, lifecycle mutations move to
  // scheduled/publishing actions with stricter state checks.
  await supabase
    .from('posts')
    .delete()
    .eq('id', parsed.data.draftId)
    .eq('user_id', user.id)
    .eq('status', 'draft');

  revalidatePath('/drafts');
  revalidatePath('/dashboard');
}

export async function duplicateDraftAction(formData: FormData) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const parsed = draftIdSchema.safeParse({
    draftId: formData.get('draftId'),
  });

  if (!user || !supabase || !parsed.success) {
    return;
  }

  const { data: source } = await supabase
    .from('posts')
    .select('id,body,timezone')
    .eq('id', parsed.data.draftId)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .maybeSingle();

  if (!source) {
    return;
  }

  const duplicateId = randomUUID();
  const { error: postError } = await supabase.from('posts').insert({
    id: duplicateId,
    user_id: user.id,
    body: source.body,
    status: 'draft',
    schedule_mode: 'now',
    timezone: source.timezone,
  });

  if (postError) {
    return;
  }

  const [{ data: targets }, { data: mediaLinks }] = await Promise.all([
    supabase
      .from('post_platform_targets')
      .select('platform,status,platform_body,settings,validation_warnings')
      .eq('user_id', user.id)
      .eq('post_id', source.id),
    supabase
      .from('post_media_assets')
      .select('media_asset_id,sort_order')
      .eq('user_id', user.id)
      .eq('post_id', source.id),
  ]);

  if (targets?.length) {
    await supabase.from('post_platform_targets').insert(
      targets.map(target => ({
        post_id: duplicateId,
        user_id: user.id,
        platform: target.platform,
        status: 'draft' as const,
        platform_body: target.platform_body,
        settings: target.settings,
        validation_warnings: target.validation_warnings,
      })),
    );
  }

  if (mediaLinks?.length) {
    await supabase.from('post_media_assets').insert(
      mediaLinks.map(link => ({
        post_id: duplicateId,
        user_id: user.id,
        media_asset_id: link.media_asset_id,
        sort_order: link.sort_order,
      })),
    );
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    post_id: duplicateId,
    type: 'post_created',
    title: 'Draft duplicated',
    message: 'A copy is ready for editing.',
  });

  revalidatePath('/drafts');
  revalidatePath('/compose');
}
