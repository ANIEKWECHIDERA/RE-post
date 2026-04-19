import { ScheduledPostsPage } from '@/features/scheduled-posts/components/scheduled-posts-page';
import { getCurrentUser } from '@/server/auth/session';
import {
  emptyScheduledPostsPageData,
  getScheduledPostsPageData,
} from '@/server/scheduled-posts/queries';

export default async function SchedulePage() {
  const user = await getCurrentUser();
  const data = user
    ? await getScheduledPostsPageData(user.id)
    : emptyScheduledPostsPageData;

  return <ScheduledPostsPage initialData={data} userId={user?.id ?? null} />;
}
