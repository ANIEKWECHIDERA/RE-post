import 'server-only';

import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { platformSchema, type Platform } from '@/schemas/platform';
import { getCurrentUser } from '@/server/auth/session';
import { getProviderSecret } from '@/server/connections/providers';
import { encryptSecret } from '@/server/security/token-vault';
import type { Json } from '@/types/database';

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type ProviderProfile = {
  providerAccountId: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  metadata: Json;
};

export async function handleProviderOAuthCallback({
  platform,
  request,
}: {
  platform: Platform;
  request: Request;
}) {
  const parsedPlatform = platformSchema.safeParse(platform);
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const providerSecret = getProviderSecret(platform);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');
  const providerError = url.searchParams.get('error');

  if (!parsedPlatform.success || !user || !supabase || !providerSecret) {
    return redirectToConnections(request, platform, 'error');
  }

  if (providerError || !code || !rawState) {
    await logConnectionFailure({
      userId: user.id,
      platform,
      message: providerError ? 'Provider denied the connection.' : 'OAuth callback was incomplete.',
    });
    return redirectToConnections(request, platform, 'error');
  }

  const stateHash = createHash('sha256').update(rawState).digest('hex');
  const { data: stateRow } = await supabase
    .from('connection_oauth_states')
    .select('id,expires_at,consumed_at')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('state_hash', stateHash)
    .maybeSingle();

  if (
    !stateRow ||
    stateRow.consumed_at ||
    Date.parse(stateRow.expires_at) <= Date.now()
  ) {
    await logConnectionFailure({
      userId: user.id,
      platform,
      message: 'OAuth state was invalid or expired.',
    });
    return redirectToConnections(request, platform, 'error');
  }

  await supabase
    .from('connection_oauth_states')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', stateRow.id)
    .eq('user_id', user.id);

  try {
    const redirectUri = new URL(providerSecret.provider.callbackPath, request.url).toString();
    const token = await exchangeCodeForToken({
      platform,
      code,
      redirectUri,
      clientId: providerSecret.clientId,
      clientSecret: providerSecret.clientSecret,
    });
    const profile = await fetchProviderProfile(platform, token.access_token);
    const tokenExpiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;

    // Trust boundary: raw provider tokens are encrypted before persistence and
    // never returned to React components. Only server-only publishing and token
    // refresh code should decrypt these fields.
    await supabase.from('social_connections').upsert(
      {
        user_id: user.id,
        platform,
        provider_account_id: profile.providerAccountId,
        display_name: profile.displayName,
        handle: profile.handle,
        avatar_url: profile.avatarUrl,
        scopes: normalizeScopes(token.scope, providerSecret.provider.scopes),
        status: 'active',
        access_token_ciphertext: encryptSecret(token.access_token),
        refresh_token_ciphertext: token.refresh_token
          ? encryptSecret(token.refresh_token)
          : null,
        token_expires_at: tokenExpiresAt,
        token_refreshed_at: null,
        token_last_checked_at: new Date().toISOString(),
        token_last_refresh_attempt_at: null,
        token_key_version: 'v1',
        connected_at: new Date().toISOString(),
        disconnected_at: null,
        last_error_code: null,
        last_error_message: null,
        metadata: profile.metadata,
      },
      {
        onConflict: 'user_id,platform,provider_account_id',
      },
    );

    await supabase.from('activity_events').insert({
      user_id: user.id,
      type: 'social_connection_created',
      title: `${providerSecret.provider.name} connected`,
      message: 'Provider tokens were stored through the encrypted server boundary.',
      metadata: {
        platform,
      },
    });

    return redirectToConnections(request, platform, 'connected');
  } catch {
    await logConnectionFailure({
      userId: user.id,
      platform,
      message: 'Provider token exchange failed.',
    });
    return redirectToConnections(request, platform, 'error');
  }
}

async function exchangeCodeForToken({
  platform,
  code,
  redirectUri,
  clientId,
  clientSecret,
}: {
  platform: Platform;
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<OAuthTokenResponse> {
  const providerSecret = getProviderSecret(platform);

  if (!providerSecret) {
    throw new Error('Provider is not configured.');
  }

  if (platform === 'facebook') {
    const tokenUrl = new URL(providerSecret.provider.tokenUrl);
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const response = await fetch(tokenUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    return parseTokenResponse(response);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(providerSecret.provider.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  return parseTokenResponse(response);
}

async function parseTokenResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as Partial<OAuthTokenResponse> | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error('Token exchange failed.');
  }

  return payload as OAuthTokenResponse;
}

async function fetchProviderProfile(
  platform: Platform,
  accessToken: string,
): Promise<ProviderProfile> {
  if (platform === 'linkedin') {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    const payload = (await response.json()) as {
      sub?: string;
      name?: string;
      picture?: string;
    };

    if (!response.ok || !payload.sub) {
      throw new Error('LinkedIn profile fetch failed.');
    }

    return {
      providerAccountId: payload.sub,
      displayName: payload.name ?? null,
      handle: null,
      avatarUrl: payload.picture ?? null,
      metadata: {
        profileKind: 'linkedin_member',
      },
    };
  }

  if (platform === 'facebook') {
    const profileUrl = new URL('https://graph.facebook.com/v24.0/me');
    profileUrl.searchParams.set('fields', 'id,name,picture');
    profileUrl.searchParams.set('access_token', accessToken);
    const response = await fetch(profileUrl, {
      headers: { Accept: 'application/json' },
    });
    const payload = (await response.json()) as {
      id?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };

    if (!response.ok || !payload.id) {
      throw new Error('Facebook profile fetch failed.');
    }

    return {
      providerAccountId: payload.id,
      displayName: payload.name ?? null,
      handle: null,
      avatarUrl: payload.picture?.data?.url ?? null,
      metadata: {
        profileKind: 'facebook_user',
        pageSelectionPending: true,
      },
    };
  }

  const profileUrl = new URL('https://graph.instagram.com/me');
  profileUrl.searchParams.set('fields', 'id,username,account_type');
  profileUrl.searchParams.set('access_token', accessToken);
  const response = await fetch(profileUrl, {
    headers: { Accept: 'application/json' },
  });
  const payload = (await response.json()) as {
    id?: string;
    username?: string;
    account_type?: string;
  };

  if (!response.ok || !payload.id) {
    throw new Error('Instagram profile fetch failed.');
  }

  return {
    providerAccountId: payload.id,
    displayName: payload.username ?? null,
    handle: payload.username ? `@${payload.username}` : null,
    avatarUrl: null,
    metadata: {
      profileKind: 'instagram_basic',
      accountType: payload.account_type ?? null,
      graphPublishingUpgradePending: true,
    },
  };
}

function normalizeScopes(scope: string | undefined, fallback: string[]) {
  return scope ? scope.split(/[,\s]+/).filter(Boolean) : fallback;
}

async function logConnectionFailure({
  userId,
  platform,
  message,
}: {
  userId: string;
  platform: Platform;
  message: string;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from('activity_events').insert({
    user_id: userId,
    type: 'social_connection_updated',
    title: 'Social connection failed',
    message,
    metadata: {
      platform,
    },
  });
}

function redirectToConnections(
  request: Request,
  platform: Platform,
  status: 'connected' | 'error',
) {
  const redirectUrl = new URL('/connections', request.url);
  redirectUrl.searchParams.set('provider', platform);
  redirectUrl.searchParams.set('status', status);
  return NextResponse.redirect(redirectUrl);
}
