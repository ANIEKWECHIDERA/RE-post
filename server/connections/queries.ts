import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProviderConfigs } from "@/server/connections/providers";
import type { SocialConnectionStatus, SocialPlatform } from "@/types/database";

export type ConnectionView = {
  id: string;
  platform: SocialPlatform;
  displayName: string | null;
  handle: string | null;
  status: SocialConnectionStatus;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
};

export async function getConnectionPageData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const providers = getProviderConfigs();

  if (!supabase) {
    return {
      providers,
      connections: [] satisfies ConnectionView[],
      loadedFromSupabase: false,
    };
  }

  const { data, error } = await supabase
    .from("social_connections")
    .select("id,platform,display_name,handle,status,connected_at,token_expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      providers,
      connections: [] satisfies ConnectionView[],
      loadedFromSupabase: false,
    };
  }

  return {
    providers,
    connections: data.map((connection) => ({
      id: connection.id,
      platform: connection.platform,
      displayName: connection.display_name,
      handle: connection.handle,
      status: connection.status,
      connectedAt: connection.connected_at,
      tokenExpiresAt: connection.token_expires_at,
    })),
    loadedFromSupabase: true,
  };
}
