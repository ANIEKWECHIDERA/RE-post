import { AnalyticsPage } from '@/features/analytics/components/analytics-page';
import { getAnalyticsPageData } from '@/server/analytics/queries';
import { getCurrentUser } from '@/server/auth/session';
import { emptyAnalyticsPageData } from '@/server/analytics/queries';

export default async function AnalyticsRoutePage() {
  const user = await getCurrentUser();
  const data = user ? await getAnalyticsPageData(user.id) : emptyAnalyticsPageData;

  return <AnalyticsPage initialData={data} userId={user?.id ?? null} />;
}
