import { DraftsPage } from '@/features/drafts/components/drafts-page';
import { getCurrentUser } from '@/server/auth/session';
import {
  emptyDraftsPageData,
  getDraftsPageData,
} from '@/server/drafts/queries';

export default async function DraftsRoutePage() {
  const user = await getCurrentUser();
  const data = user ? await getDraftsPageData(user.id) : emptyDraftsPageData;

  return <DraftsPage initialData={data} userId={user?.id ?? null} />;
}
