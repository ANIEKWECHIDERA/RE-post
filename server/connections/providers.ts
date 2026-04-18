import "server-only";

import { getServerEnv } from "@/lib/env/server";
import type { Platform } from "@/schemas/platform";

type ProviderConfig = {
  platform: Platform;
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  authBaseUrl: string;
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
    authBaseUrl: "https://www.linkedin.com/oauth/v2/authorization",
    callbackPath: "/api/connections/linkedin/callback",
  },
  facebook: {
    platform: "facebook",
    name: "Facebook",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scopes: ["pages_manage_posts", "pages_read_engagement"],
    authBaseUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    callbackPath: "/api/connections/facebook/callback",
  },
  instagram: {
    platform: "instagram",
    name: "Instagram",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    scopes: ["instagram_basic", "instagram_content_publish"],
    authBaseUrl: "https://api.instagram.com/oauth/authorize",
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
