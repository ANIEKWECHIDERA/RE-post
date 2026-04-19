'use client';

import { Activity, BarChart3, Flame, Percent, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAnalyticsPage } from '@/hooks/use-analytics-page';
import { usePageRealtime } from '@/hooks/use-page-realtime';
import { isSupabaseConfigured } from '@/lib/env/public';
import { platformLabels } from '@/schemas/platform';
import type { AnalyticsPageData } from '@/types/analytics';

export function AnalyticsPage({
  initialData,
  userId,
}: {
  initialData: AnalyticsPageData;
  userId: string | null;
}) {
  const queryKeys = useMemo(
    () => [['analytics-summary'], ['dashboard-summary']],
    [],
  );
  const { data, isFetching } = useAnalyticsPage(initialData);
  const maxWeeklyPosts = Math.max(
    1,
    ...data.analytics.weeklyPosts.map(week => week.posts),
  );

  usePageRealtime({
    enabled: isSupabaseConfigured(),
    userId,
    queryKeys,
  });

  return (
    <section className="grid gap-6">
      <Card className="rounded-lg border bg-card shadow-soft">
        <CardHeader>
          <Badge className="w-fit rounded-md" variant="outline">
            Analytics
          </Badge>
          <CardTitle className="mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
            Proof that consistency compounds.
          </CardTitle>
          <CardDescription className="mt-3 max-w-2xl text-base">
            Internal publishing analytics are live. Engagement metrics stay
            clearly separated until provider APIs are connected.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={TrendingUp}
          label="Total posts"
          value={data.analytics.totalPosts}
        />
        <MetricCard
          icon={BarChart3}
          label="Published"
          value={data.analytics.publishedPosts}
        />
        <MetricCard
          icon={Percent}
          label="Success rate"
          value={`${data.analytics.publishSuccessRate}%`}
        />
        <MetricCard
          icon={Activity}
          label="Failure rate"
          value={`${getFailureRate(data)}%`}
        />
        <MetricCard
          icon={Flame}
          label="Current streak"
          value={`${data.currentStreak} days`}
          note={data.streakStatus.label}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Posts over time</CardTitle>
            <CardDescription>
              Six-week internal output trend from created posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.analytics.weeklyPosts.map(week => (
              <div
                className="grid grid-cols-[76px_1fr_40px] items-center gap-3"
                key={week.weekStart}
              >
                <span className="text-xs text-muted-foreground">
                  {formatShortDate(week.weekStart)}
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(week.posts / maxWeeklyPosts, 0.06) * 100}%`,
                    }}
                  />
                </span>
                <span className="text-right text-sm font-medium">
                  {week.posts}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Scheduled vs instant</CardTitle>
            <CardDescription>
              How your publishing habit is split right now.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Instant</p>
              <p className="mt-1 text-3xl font-semibold">
                {data.analytics.instantPosts}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="mt-1 text-3xl font-semibold">
                {data.analytics.scheduledPosts}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Platform spread</CardTitle>
            <CardDescription>Targets by platform and outcome.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.analytics.platformBreakdown.map(platform => (
              <div className="rounded-lg border p-3" key={platform.platform}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {platformLabels[platform.platform]}
                  </p>
                  <Badge className="rounded-md" variant="secondary">
                    {platform.total} total
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {platform.published} published / {platform.failed} failed
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Streak trend</CardTitle>
            <CardDescription>{data.streakStatus.message}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.analytics.streakHistory.length > 0 ? (
              data.analytics.streakHistory.map(item => (
                <div
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  key={`${item.date}-${item.type}`}
                >
                  <span>{formatShortDate(item.date)}</span>
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Streak history appears after successful publishes.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>External engagement</CardTitle>
            <CardDescription>
              Provider engagement metrics are scaffolded, not live.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Badge className="w-fit rounded-md" variant="outline">
              pending OAuth + provider analytics
            </Badge>
            <p className="text-muted-foreground">
              Impressions, comments, clicks, saves, and follower deltas will
              come from provider APIs after real connected accounts are live.
            </p>
            <p className="text-xs text-muted-foreground">
              Internal analytics refreshed {isFetching ? 'now' : 'recently'}.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <Card className="rounded-lg border bg-card shadow-soft">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function getFailureRate(data: AnalyticsPageData) {
  const decided =
    data.analytics.successfulTargets + data.analytics.failedTargets;

  return decided === 0
    ? 0
    : Math.round((data.analytics.failedTargets / decided) * 100);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
