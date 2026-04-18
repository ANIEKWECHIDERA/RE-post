import { CreatorDashboard } from "@/features/dashboard/components/creator-dashboard";
import { getCurrentUser } from "@/server/auth/session";
import { emptyDashboardSummary, getDashboardSummary } from "@/server/dashboard/queries";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const summary = user ? await getDashboardSummary(user.id) : emptyDashboardSummary;

  return <CreatorDashboard initialSummary={summary} userId={user?.id ?? null} />;
}
