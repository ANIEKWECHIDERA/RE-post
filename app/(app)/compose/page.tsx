import { PostComposer } from "@/features/composer/components/post-composer";
import { getCurrentUser } from "@/server/auth/session";
import { getComposerDraftDetail } from "@/server/drafts/queries";

export default async function ComposePage({
  searchParams,
}: {
  searchParams?: Promise<{ draftId?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const draft =
    user && params?.draftId
      ? await getComposerDraftDetail({
          userId: user.id,
          draftId: params.draftId,
        })
      : null;

  return <PostComposer initialDraft={draft} />;
}
