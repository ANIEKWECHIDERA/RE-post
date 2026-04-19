import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getProviderSecret } from '@/server/connections/providers';
import { decryptSecret, encryptSecret } from '@/server/security/token-vault';
import type { Json, SocialPlatform } from '@/types/database';

export type ActiveProviderToken =
  | {
      ok: true;
      connectionId: string;
      platform: SocialPlatform;
      accessToken: string;
      expiresAt: string | null;
      scopes: string[];
      providerAccountId: string;
      metadata: Json;
    }
  | {
      ok: false;
      code:
        | 'connection_missing'
        | 'token_missing'
        | 'token_expired'
        | 'token_decrypt_failed'
        | 'token_refresh_failed';
      message: string;
      retryable: boolean;
    };

export async function getActiveProviderToken({
  userId,
  platform,
}: {
  userId: string;
  platform: SocialPlatform;
}): Promise<ActiveProviderToken> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      code: 'connection_missing',
      message: 'Supabase service role is not configured.',
      retryable: false,
    };
  }

  // Trust boundary: this service uses the admin client because scheduled
  // publishing runs outside a browser session. Callers must pass the owner id,
  // and this function returns raw tokens only to server-only publishing code.
  const { data: connection } = await supabase
    .from('social_connections')
    .select(
      'id,platform,provider_account_id,status,scopes,access_token_ciphertext,refresh_token_ciphertext,token_expires_at,metadata',
    )
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle();

  if (!connection) {
    return {
      ok: false,
      code: 'connection_missing',
      message: `No active ${platform} connection is available.`,
      retryable: false,
    };
  }

  await supabase
    .from('social_connections')
    .update({ token_last_checked_at: new Date().toISOString() })
    .eq('id', connection.id)
    .eq('user_id', userId);

  if (!connection.access_token_ciphertext) {
    await markConnectionTokenFailure(connection.id, userId, 'token_missing');
    return {
      ok: false,
      code: 'token_missing',
      message: `The ${platform} connection has no encrypted access token.`,
      retryable: false,
    };
  }

  if (isExpired(connection.token_expires_at)) {
    const refreshed = await refreshConnectionToken({
      connectionId: connection.id,
      userId,
      platform,
      refreshTokenCiphertext: connection.refresh_token_ciphertext,
    });

    if (!refreshed.ok) {
      return refreshed;
    }

    return {
      ok: true,
      connectionId: connection.id,
      platform,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
      scopes: connection.scopes,
      providerAccountId: connection.provider_account_id,
      metadata: connection.metadata,
    };
  }

  try {
    return {
      ok: true,
      connectionId: connection.id,
      platform,
      accessToken: decryptSecret(connection.access_token_ciphertext),
      expiresAt: connection.token_expires_at,
      scopes: connection.scopes,
      providerAccountId: connection.provider_account_id,
      metadata: connection.metadata,
    };
  } catch {
    await markConnectionTokenFailure(connection.id, userId, 'token_decrypt_failed');
    return {
      ok: false,
      code: 'token_decrypt_failed',
      message: 'The encrypted provider token could not be opened.',
      retryable: false,
    };
  }
}

async function refreshConnectionToken({
  connectionId,
  userId,
  platform,
  refreshTokenCiphertext,
}: {
  connectionId: string;
  userId: string;
  platform: SocialPlatform;
  refreshTokenCiphertext: string | null;
}): Promise<
  | { ok: true; accessToken: string; expiresAt: string | null }
  | Extract<ActiveProviderToken, { ok: false }>
> {
  const supabase = createSupabaseAdminClient();
  const providerSecret = getProviderSecret(platform);

  if (!supabase || !providerSecret || !refreshTokenCiphertext) {
    await markConnectionTokenFailure(connectionId, userId, 'token_expired');
    return {
      ok: false,
      code: 'token_expired',
      message: `The ${platform} token expired and cannot be refreshed automatically.`,
      retryable: false,
    };
  }

  await supabase
    .from('social_connections')
    .update({ token_last_refresh_attempt_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('user_id', userId);

  try {
    const refreshToken = decryptSecret(refreshTokenCiphertext);
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: providerSecret.clientId,
      client_secret: providerSecret.clientSecret,
    });
    const response = await fetch(providerSecret.provider.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
        }
      | null;

    if (!response.ok || !payload?.access_token) {
      throw new Error('Refresh failed.');
    }

    const expiresAt = payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null;

    await supabase
      .from('social_connections')
      .update({
        access_token_ciphertext: encryptSecret(payload.access_token),
        refresh_token_ciphertext: payload.refresh_token
          ? encryptSecret(payload.refresh_token)
          : refreshTokenCiphertext,
        token_expires_at: expiresAt,
        token_refreshed_at: new Date().toISOString(),
        token_last_checked_at: new Date().toISOString(),
        token_key_version: 'v1',
        status: 'active',
        last_error_code: null,
        last_error_message: null,
      })
      .eq('id', connectionId)
      .eq('user_id', userId);

    return {
      ok: true,
      accessToken: payload.access_token,
      expiresAt,
    };
  } catch {
    await markConnectionTokenFailure(connectionId, userId, 'token_refresh_failed');
    return {
      ok: false,
      code: 'token_refresh_failed',
      message: `The ${platform} token refresh failed.`,
      retryable: false,
    };
  }
}

async function markConnectionTokenFailure(
  connectionId: string,
  userId: string,
  code: string,
) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from('social_connections')
    .update({
      status: code === 'token_expired' ? 'expired' : 'error',
      last_error_code: code,
      last_error_message: 'Provider token needs attention.',
      token_last_checked_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .eq('user_id', userId);
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  // Treat tokens inside a 60-second window as expired so a publish attempt does
  // not start with a token that dies mid-request.
  return Date.parse(expiresAt) <= Date.now() + 60_000;
}
