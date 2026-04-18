import { ConnectionsDashboard } from "@/features/connections/components/connections-dashboard";
import { getCurrentUser } from "@/server/auth/session";
import { getConnectionPageData } from "@/server/connections/queries";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();
  const data = user
    ? await getConnectionPageData(user.id)
    : { providers: [], connections: [], loadedFromSupabase: false };

  return <ConnectionsDashboard data={data} />;
}
