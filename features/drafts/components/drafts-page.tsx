'use client';

import { Copy, FileText, PenSquare, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDrafts } from '@/hooks/use-drafts';
import { usePageRealtime } from '@/hooks/use-page-realtime';
import { isSupabaseConfigured } from '@/lib/env/public';
import { platformLabels } from '@/schemas/platform';
import {
  deleteDraftAction,
  duplicateDraftAction,
} from '@/server/drafts/actions';
import type { DraftListItem, DraftsPageData } from '@/types/drafts';

export function DraftsPage({
  initialData,
  userId,
}: {
  initialData: DraftsPageData;
  userId: string | null;
}) {
  const queryKeys = useMemo(() => [['drafts']], []);
  const { data, isFetching } = useDrafts(initialData);

  usePageRealtime({
    enabled: isSupabaseConfigured(),
    userId,
    queryKeys,
  });

  return (
    <section className="grid gap-6">
      <Card className="rounded-lg border bg-card shadow-soft">
        <CardHeader className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge className="w-fit rounded-md" variant="outline">
              Drafts
            </Badge>
            <CardTitle className="mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
              Keep the ideas warm.
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl text-base">
              Drafts are where unfinished thoughts become consistent output.
              Phase 1 reads real draft posts and prepares the edit/send flows.
            </CardDescription>
          </div>
          <div className="rounded-lg border bg-background p-4 text-sm">
            <p className="text-muted-foreground">Draft count</p>
            <p className="mt-1 text-2xl font-semibold">
              {isFetching ? 'Syncing' : data.drafts.length}
            </p>
          </div>
        </CardHeader>
      </Card>

      {data.drafts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.drafts.map(draft => (
            <DraftCard draft={draft} key={draft.id} />
          ))}
        </div>
      ) : (
        <Card className="rounded-lg border border-dashed bg-card">
          <CardContent className="grid gap-3 p-8">
            <FileText className="h-10 w-10 text-primary" />
            <CardTitle>No drafts yet</CardTitle>
            <CardDescription>
              Save a work-in-progress post and it will appear here with platform
              readiness, media context, and quick actions.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function DraftCard({ draft }: { draft: DraftListItem }) {
  return (
    <Card className="rounded-lg border bg-card shadow-soft">
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <DraftMedia draft={draft} />
            <div>
              <Badge
                className="rounded-md"
                variant={
                  draft.validationState === 'ready' ? 'secondary' : 'outline'
                }
              >
                {draft.validationState === 'ready' ? 'ready' : 'needs review'}
              </Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                Updated {formatDateTime(draft.updatedAt)}
              </p>
            </div>
          </div>
        </div>
        <p className="min-h-16 text-sm font-medium">{draft.bodyPreview}</p>
        <div className="flex flex-wrap gap-2">
          {draft.platforms.length > 0 ? (
            draft.platforms.map(target => (
              <Badge
                className="rounded-md"
                key={`${draft.id}-${target.platform}`}
                variant="secondary"
              >
                {platformLabels[target.platform]}
              </Badge>
            ))
          ) : (
            <Badge className="rounded-md" variant="outline">
              no platforms yet
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-md" size="sm" variant="outline">
            <Link href={`/compose?draftId=${draft.id}`}>
              <PenSquare className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild className="rounded-md" size="sm" variant="outline">
            <Link href={`/compose?draftId=${draft.id}`}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Link>
          </Button>
          <Button asChild className="rounded-md" size="sm" variant="outline">
            <Link href={`/compose?draftId=${draft.id}`}>Schedule</Link>
          </Button>
          <form action={duplicateDraftAction}>
            <input name="draftId" type="hidden" value={draft.id} />
            <Button className="rounded-md" size="sm" type="submit" variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
          </form>
          <form action={deleteDraftAction}>
            <input name="draftId" type="hidden" value={draft.id} />
            <Button className="rounded-md" size="sm" type="submit" variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function DraftMedia({ draft }: { draft: DraftListItem }) {
  if (!draft.mediaPreview?.signedUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <FileText className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      aria-label="Draft media preview"
      className="h-16 w-16 rounded-lg border bg-cover bg-center"
      role="img"
      style={{ backgroundImage: `url(${draft.mediaPreview.signedUrl})` }}
    />
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
