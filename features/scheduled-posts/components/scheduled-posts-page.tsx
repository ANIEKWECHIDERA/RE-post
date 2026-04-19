'use client';

import {
  CalendarClock,
  Copy,
  Filter,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { usePageRealtime } from '@/hooks/use-page-realtime';
import { useScheduledPosts } from '@/hooks/use-scheduled-posts';
import { isSupabaseConfigured } from '@/lib/env/public';
import { platformLabels } from '@/schemas/platform';
import {
  cancelScheduledPostAction,
  deleteScheduledPostAction,
  duplicateScheduledPostAction,
  editScheduledPostAction,
  reschedulePostAction,
} from '@/server/scheduling/actions';
import type { PostStatus, SocialPlatform } from '@/types/database';
import type {
  ScheduledPostListItem,
  ScheduledPostsPageData,
  ScheduledPostStatusGroup,
} from '@/types/scheduled-posts';

const statusFilters: Array<{ label: string; value: ScheduledPostStatusGroup | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
  { label: 'Completed', value: 'completed' },
];

const platformFilters: Array<{ label: string; value: SocialPlatform | 'all' }> = [
  { label: 'All platforms', value: 'all' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'LinkedIn', value: 'linkedin' },
];

const dateFilters = [
  { label: 'Any date', value: 'all' },
  { label: 'Next 7 days', value: 'week' },
  { label: 'Later', value: 'later' },
  { label: 'Past', value: 'past' },
] as const;

type DateFilter = (typeof dateFilters)[number]['value'];

export function ScheduledPostsPage({
  initialData,
  userId,
}: {
  initialData: ScheduledPostsPageData;
  userId: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<ScheduledPostStatusGroup | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [minimumScheduleTime] = useState(() =>
    toDateTimeLocal(new Date(Date.now() + 2 * 60 * 1000).toISOString()),
  );
  const queryKeys = useMemo(() => [['scheduled-posts']], []);
  const { data, isFetching } = useScheduledPosts(initialData);

  usePageRealtime({
    enabled: isSupabaseConfigured(),
    userId,
    queryKeys,
  });

  const filteredPosts = data.posts.filter(post => {
    const statusMatches =
      statusFilter === 'all' || post.statusGroup === statusFilter;
    const platformMatches =
      platformFilter === 'all' ||
      post.platforms.some(target => target.platform === platformFilter);
    const dateMatches = matchesDateFilter(post, dateFilter);

    return statusMatches && platformMatches && dateMatches;
  });

  return (
    <section className="grid gap-6">
      <Card className="overflow-hidden rounded-lg border bg-card shadow-soft">
        <CardHeader className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge className="w-fit rounded-md" variant="outline">
              Scheduled posts
            </Badge>
            <CardTitle className="mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
              Keep future-you covered.
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl text-base">
              See what is lined up, what is running, and what needs a recovery
              pass before the streak clock gets loud.
            </CardDescription>
          </div>
          <div className="rounded-lg border bg-background p-4 text-sm">
            <p className="text-muted-foreground">Realtime state</p>
            <p className="mt-1 text-2xl font-semibold">
              {isFetching ? 'Syncing' : `${filteredPosts.length} visible`}
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-lg border bg-card shadow-soft">
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters are client-side in Phase 1; the data source is Supabase.
          </div>
          <FilterPills
            items={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterPills
            items={platformFilters}
            value={platformFilter}
            onChange={setPlatformFilter}
          />
          <FilterPills
            items={dateFilters}
            value={dateFilter}
            onChange={setDateFilter}
          />
        </CardContent>
      </Card>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-4">
          {filteredPosts.map(post => (
            <ScheduledPostCard
              key={post.id}
              minimumScheduleTime={minimumScheduleTime}
              post={post}
              timezone={timezone}
            />
          ))}
        </div>
      ) : (
        <EmptyScheduledState />
      )}
    </section>
  );
}

function FilterPills<TValue extends string>({
  items,
  value,
  onChange,
}: {
  items: ReadonlyArray<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <Button
          key={item.value}
          className="rounded-md"
          size="sm"
          type="button"
          variant={value === item.value ? 'default' : 'outline'}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function ScheduledPostCard({
  post,
  minimumScheduleTime,
  timezone,
}: {
  post: ScheduledPostListItem;
  minimumScheduleTime: string;
  timezone: string;
}) {
  const canMutate = canEditOrReschedule(post.status);
  const queryClient = useQueryClient();
  const refreshAfterAction = async (
    action: (formData: FormData) => Promise<void>,
    formData: FormData,
  ) => {
    await action(formData);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ]);
  };

  return (
    <Card className="rounded-lg border bg-card shadow-soft">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[92px_1fr] lg:items-start">
        <MediaPreview post={post} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            {post.job ? (
              <Badge className="rounded-md" variant="outline">
                job {post.job.status}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {post.scheduledAt
                ? formatDateTime(post.scheduledAt)
                : 'No scheduled time'}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium">{post.bodyPreview}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.platforms.map(target => (
              <Badge
                className="rounded-md"
                key={`${post.id}-${target.platform}`}
                variant="secondary"
              >
                {platformLabels[target.platform]} / {target.status}
              </Badge>
            ))}
          </div>
          {post.job?.lastErrorMessage ? (
            <p className="mt-2 text-xs text-destructive">
              {post.job.lastErrorMessage}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3">
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                View
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {post.body}
              </p>
            </details>

            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Edit caption
              </summary>
              <form
                action={formData =>
                  refreshAfterAction(editScheduledPostAction, formData)
                }
                className="mt-3 grid gap-3"
              >
                <input name="postId" type="hidden" value={post.id} />
                <Textarea
                  className="min-h-28 rounded-md"
                  defaultValue={post.body}
                  disabled={!canMutate}
                  maxLength={3000}
                  name="body"
                  required
                />
                <Button
                  className="w-fit rounded-md"
                  disabled={!canMutate}
                  size="sm"
                  type="submit"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Save edit
                </Button>
              </form>
            </details>

            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Reschedule
              </summary>
              <form
                action={formData =>
                  refreshAfterAction(reschedulePostAction, formData)
                }
                className="mt-3 flex flex-wrap gap-2"
              >
                <input name="postId" type="hidden" value={post.id} />
                <input name="timezone" type="hidden" value={timezone} />
                <input
                  className="h-8 rounded-md border bg-background px-3 text-sm"
                  defaultValue={toDateTimeLocal(post.scheduledAt)}
                  disabled={!canMutate}
                  min={minimumScheduleTime}
                  name="scheduledAt"
                  required
                  type="datetime-local"
                />
                <Button
                  className="rounded-md"
                  disabled={!canMutate}
                  size="sm"
                  type="submit"
                  variant="outline"
                >
                  Reschedule
                </Button>
              </form>
            </details>

            <div className="flex flex-wrap gap-2">
              <form
                action={formData =>
                  refreshAfterAction(duplicateScheduledPostAction, formData)
                }
              >
                <input name="postId" type="hidden" value={post.id} />
                <Button className="rounded-md" size="sm" type="submit" variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </form>
              <form
                action={formData =>
                  refreshAfterAction(cancelScheduledPostAction, formData)
                }
              >
                <input name="postId" type="hidden" value={post.id} />
                <Button
                  className="rounded-md"
                  disabled={!canCancel(post.status)}
                  size="sm"
                  type="submit"
                  variant="outline"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </form>
              <form
                action={formData =>
                  refreshAfterAction(deleteScheduledPostAction, formData)
                }
              >
                <input name="postId" type="hidden" value={post.id} />
                <Button
                  className="rounded-md"
                  disabled={!canDelete(post.status)}
                  size="sm"
                  type="submit"
                  variant="outline"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaPreview({ post }: { post: ScheduledPostListItem }) {
  if (!post.mediaPreview?.signedUrl) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <CalendarClock className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div
      aria-label="Media preview"
      className="h-20 w-20 rounded-lg border bg-cover bg-center"
      role="img"
      style={{ backgroundImage: `url(${post.mediaPreview.signedUrl})` }}
    />
  );
}

function EmptyScheduledState() {
  return (
    <Card className="rounded-lg border border-dashed bg-card">
      <CardContent className="grid gap-3 p-8">
        <CalendarClock className="h-10 w-10 text-primary" />
        <CardTitle>No scheduled posts match this view</CardTitle>
        <CardDescription>
          Queue a post from Compose and it will land here with its platforms,
          worker status, and realtime publishing updates.
        </CardDescription>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Schedule a post from Composer and it will appear here with secure
          edit, reschedule, cancel, duplicate, and terminal delete actions.
        </p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const variant = status === 'failed' || status === 'partially_failed' ? 'destructive' : 'secondary';

  return (
    <Badge className="rounded-md" variant={variant}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

function canDelete(status: PostStatus) {
  return status === 'canceled' || status === 'failed';
}

function canCancel(status: PostStatus) {
  return status === 'scheduled' || status === 'queued';
}

function canEditOrReschedule(status: PostStatus) {
  return (
    status === 'scheduled' ||
    status === 'queued' ||
    status === 'failed' ||
    status === 'partially_failed'
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function matchesDateFilter(post: ScheduledPostListItem, filter: DateFilter) {
  if (filter === 'all') {
    return true;
  }

  if (!post.scheduledAt) {
    return false;
  }

  const scheduledTime = Date.parse(post.scheduledAt);
  const now = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;

  if (filter === 'week') {
    return scheduledTime >= now && scheduledTime <= sevenDays;
  }

  if (filter === 'later') {
    return scheduledTime > sevenDays;
  }

  return scheduledTime < now;
}
