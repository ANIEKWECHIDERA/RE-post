import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBodyPreview, getFirstMediaPreviews } from '@/server/posts/list-helpers';
import type { DraftsPageData } from '@/types/drafts';

export const emptyDraftsPageData: DraftsPageData = {
  drafts: [],
  loadedFromSupabase: false,
};

export async function getDraftsPageData(
  userId: string,
): Promise<DraftsPageData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyDraftsPageData;
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,body,status,created_at,updated_at')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    return emptyDraftsPageData;
  }

  const postIds = (posts ?? []).map(post => post.id);
  let targets: Array<{
    post_id: string;
    platform: 'linkedin' | 'facebook' | 'instagram';
    status:
      | 'draft'
      | 'pending'
      | 'queued'
      | 'publishing'
      | 'published'
      | 'failed'
      | 'retry_scheduled'
      | 'canceled';
    validation_warnings: unknown;
  }> = [];
  const mediaPreviews = await getFirstMediaPreviews(userId, postIds);

  if (postIds.length > 0) {
    const targetsResult = await supabase
      .from('post_platform_targets')
      .select('post_id,platform,status,validation_warnings')
      .eq('user_id', userId)
      .in('post_id', postIds);

    targets = targetsResult.data ?? [];
  }

  const targetsByPost = new Map<string, typeof targets>();
  for (const target of targets) {
    const current = targetsByPost.get(target.post_id) ?? [];
    current.push(target);
    targetsByPost.set(target.post_id, current);
  }

  return {
    loadedFromSupabase: true,
    drafts: (posts ?? []).map(post => {
      const targets = targetsByPost.get(post.id) ?? [];
      const needsReview = targets.some(target =>
        Array.isArray(target.validation_warnings)
          ? target.validation_warnings.length > 0
          : Boolean(target.validation_warnings),
      );

      return {
        id: post.id,
        body: post.body,
        bodyPreview: getBodyPreview(post.body),
        status: post.status,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        platforms: targets.map(target => ({
          platform: target.platform,
          status: target.status,
          validationWarnings: target.validation_warnings,
        })),
        mediaPreview: mediaPreviews.get(post.id) ?? null,
        validationState: needsReview ? 'needs_review' : 'ready',
      };
    }),
  };
}
