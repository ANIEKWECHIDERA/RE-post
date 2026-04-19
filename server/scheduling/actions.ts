'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cancelScheduledPostSchema } from '@/schemas/scheduling';
import { getCurrentUser } from '@/server/auth/session';

export async function cancelScheduledPostAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return;
  }

  const parsed = cancelScheduledPostSchema.safeParse({
    postId: formData.get('postId'),
  });

  if (!parsed.success) {
    return;
  }

  // Cancellation is deliberately routed through a Postgres function so the
  // post, queued job, platform targets, and audit event change together. RLS
  // still scopes the call to the authenticated creator.
  await supabase.rpc('cancel_scheduled_post', {
    post_id_input: parsed.data.postId,
  });

  revalidatePath('/dashboard');
}
