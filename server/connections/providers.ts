import "server-only";

import { getServerEnv } from "@/lib/env/server";
import type { Platform } from "@/schemas/platform";

type ProviderConfig = {
  platform: Platform;
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  scopeSeparator: ' ' | ',';
  authParams?: Record<string, string>;
  authBaseUrl: string;
  tokenUrl: string;
  profileUrl: string;
  callbackPath: string;
  status: "oauth_pending" | "config_missing" | "ready_for_oauth";
};

const providerConfigs: Record<Platform, Omit<ProviderConfig, "status">> = {
  linkedin: {
    platform: "linkedin",
    name: "LinkedIn",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: ["w_member_social", "openid", "profile"],
    scopeSeparator: " ",
    authBaseUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    callbackPath: "/api/connections/linkedin/callback",
  },
  facebook: {
    platform: "facebook",
    name: "Facebook",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scopes: ["public_profile", "pages_show_list", "pages_read_engagement"],
    scopeSeparator: ",",
    authBaseUrl: "https://www.facebook.com/v24.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v24.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/v24.0/me",
    callbackPath: "/api/connections/facebook/callback",
  },
  instagram: {
    platform: "instagram",
    name: "Instagram",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    scopes: [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_comments",
      "instagram_business_manage_messages",
    ],
    scopeSeparator: ",",
    authParams: {
      enable_fb_login: "0",
      force_authentication: "1",
    },
    authBaseUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    profileUrl: "https://graph.instagram.com/me",
    callbackPath: "/api/connections/instagram/callback",
  },
};

export function getProviderConfigs(): ProviderConfig[] {
  const env = getServerEnv();

  return Object.values(providerConfigs).map((config) => {
    const clientId = env?.[config.clientIdEnv as keyof typeof env];
    const clientSecret = env?.[config.clientSecretEnv as keyof typeof env];

    return {
      ...config,
      status: clientId && clientSecret ? "ready_for_oauth" : "config_missing",
    };
  });
}

export function getProviderConfig(platform: Platform) {
  return getProviderConfigs().find((provider) => provider.platform === platform) ?? null;
}

export function getProviderSecret(platform: Platform) {
  const env = getServerEnv();
  const provider = getProviderConfig(platform);

  if (!env || !provider || provider.status !== "ready_for_oauth") {
    return null;
  }

  const clientId = env[provider.clientIdEnv as keyof typeof env];
  const clientSecret = env[provider.clientSecretEnv as keyof typeof env];

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    provider,
    clientId,
    clientSecret,
  };
}
