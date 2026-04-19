import 'server-only';

import type { User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ProfileBootstrapResult =
  | { ok: true }
  | { ok: false; message: string };

export async function ensureProfileBootstrap(
  user: User,
): Promise<ProfileBootstrapResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured.',
    };
  }

  const timezone =
    typeof user.user_metadata.timezone === 'string'
      ? user.user_metadata.timezone
      : 'UTC';
  const displayName =
    typeof user.user_metadata.display_name === 'string'
      ? user.user_metadata.display_name
      : null;

  // The database trigger should create these rows on signup. This upsert is a
  // defensive repair path for imported users or environments where the trigger
  // was added after auth users already existed.
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName,
    timezone,
  });

  if (profileError) {
    return {
      ok: false,
      message:
        'Profile bootstrap failed. Confirm database migrations have been applied.',
    };
  }

  const { error: streakError } = await supabase.from('streak_state').upsert({
    user_id: user.id,
    timezone,
  });

  if (streakError) {
    return {
      ok: false,
      message:
        'Streak bootstrap failed. Confirm database migrations have been applied.',
    };
  }

  return { ok: true };
}
