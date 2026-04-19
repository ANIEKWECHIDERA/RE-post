'use server';

import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  connectionActionSchema,
  connectionIdSchema,
} from '@/schemas/connection';
import { getCurrentUser } from '@/server/auth/session';
import { getProviderConfig } from '@/server/connections/providers';
import { encryptSecret } from '@/server/security/token-vault';

export type ConnectionActionState = {
  ok: boolean;
  message: string;
};

export async function prepareConnectionAction(
  _: ConnectionActionState,
  formData: FormData,
) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return {
      ok: false,
      message: 'Sign in before connecting social accounts.',
    };
  }

  const parsed = connectionActionSchema.safeParse({
    platform: formData.get('platform'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Choose a supported provider.',
    };
  }

  const provider = getProviderConfig(parsed.data.platform);

  if (!provider || provider.status !== 'ready_for_oauth') {
    return {
      ok: false,
      message: 'Provider OAuth credentials are not configured yet.',
    };
  }

  const rawState = randomUUID();
  const codeVerifier = randomBytes(32).toString('base64url');
  const stateHash = createHash('sha256').update(rawState).digest('hex');

  const { error } = await supabase.from('connection_oauth_states').insert({
    user_id: user.id,
    platform: parsed.data.platform,
    state_hash: stateHash,
    code_verifier_ciphertext: encryptSecret(codeVerifier),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    return {
      ok: false,
      message:
        'OAuth state could not be prepared. Confirm database migrations are applied.',
    };
  }

  revalidatePath('/connections');

  return {
    ok: true,
    message: `${provider.name} OAuth state is prepared. Redirect/callback exchange is pending provider app setup.`,
  };
}

export async function revokeConnectionAction(
  _: ConnectionActionState,
  formData: FormData,
) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return {
      ok: false,
      message: 'Sign in before changing social connections.',
    };
  }

  const parsed = connectionIdSchema.safeParse({
    connectionId: formData.get('connectionId'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Invalid connection.',
    };
  }

  const { error } = await supabase
    .from('social_connections')
    .update({
      status: 'revoked',
      access_token_ciphertext: null,
      refresh_token_ciphertext: null,
      disconnected_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.connectionId)
    .eq('user_id', user.id);

  if (error) {
    return {
      ok: false,
      message: 'Connection could not be revoked.',
    };
  }

  await supabase.from('activity_events').insert({
    user_id: user.id,
    type: 'social_connection_updated',
    title: 'Social connection revoked',
    message: 'Provider tokens were cleared server-side.',
  });

  revalidatePath('/connections');
  revalidatePath('/dashboard');

  return {
    ok: true,
    message: 'Connection revoked.',
  };
}
