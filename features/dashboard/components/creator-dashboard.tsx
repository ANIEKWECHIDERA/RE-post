'use client';

import {
  Activity,
  CalendarClock,
  CalendarX,
  Flame,
  type LucideIcon,
  Radio,
  Send,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { isSupabaseConfigured } from '@/lib/env/public';
import { platformLabels } from '@/schemas/platform';
import { cancelScheduledPostAction } from '@/server/scheduling/actions';
import type { DashboardSummary } from '@/types/dashboard';

const emptyActivityItems = [
  {
    id: 'empty-1',
    title: 'No activity yet',
    message:
      'Your publish wins, uploads, retries, and streak updates will land here.',
    tone: 'bg-emerald-500',
  },
  {
    id: 'empty-2',
    title: 'Realtime is ready',
    message:
      'Once Supabase is configured, dashboard updates will refresh without a manual reload.',
    tone: 'bg-cyan-500',
  },
];

export function CreatorDashboard({
  initialSummary,
  userId,
}: {
  initialSummary: DashboardSummary;
  userId: string | null;
}) {
  const { data, isLoading } = useDashboardSummary(initialSummary);
  const supabaseReady = isSupabaseConfigured();
  useDashboardRealtime({ enabled: supabaseReady, userId });
  const realtimeStatus = supabaseReady && userId ? 'listening' : 'waiting';

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <CardHeader className="grid gap-4 md:grid-cols-[1fr_120px] md:items-center">
            <div>
              <Badge
                variant="outline"
                className="w-fit rounded-md border-primary/30 text-primary"
              >
                Creator home
              </Badge>
              <CardTitle className="mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
                Keep the streak alive.
              </CardTitle>
              <CardDescription className="mt-3 max-w-2xl text-base">
                Plan the next post, keep platform work visible, and build the
                habit loop before the feed gets noisy.
              </CardDescription>
            </div>
            <Image
              src="/images/trend_12735449.png"
              alt="Growth signal"
              width={96}
              height={96}
              className="h-24 w-24 justify-self-start object-contain md:justify-self-end"
            />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-md">
              <Link href="/compose">
                <Send className="mr-2 h-4 w-4" />
                Quick compose
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/compose">
                <CalendarClock className="mr-2 h-4 w-4" />
                Schedule a post
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Radio className="h-5 w-5 text-accent" />
              System status
            </CardTitle>
            <CardDescription>
              Dashboard data now reads through the authenticated Supabase
              boundary.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Supabase env</span>
              <Badge
                className="rounded-md"
                variant={supabaseReady ? 'default' : 'secondary'}
              >
                {supabaseReady ? 'configured' : 'pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Publishing</span>
              <Badge variant="outline" className="rounded-md">
                server-only scaffold
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Realtime</span>
              <Badge variant="outline" className="rounded-md">
                {realtimeStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data source</span>
              <Badge
                variant={data.loadedFromSupabase ? 'default' : 'secondary'}
                className="rounded-md"
              >
                {data.loadedFromSupabase ? 'Supabase' : 'empty'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Flame}
          label="Current streak"
          value={isLoading ? '--' : `${data?.currentStreak ?? 0} days`}
        />
        <MetricCard
          icon={Flame}
          label="Best streak"
          value={isLoading ? '--' : `${data?.longestStreak ?? 0} days`}
        />
        <MetricCard
          icon={Sparkles}
          label="Posts this week"
          value={isLoading ? '--' : `${data?.postsThisWeek ?? 0}`}
        />
        <MetricCard
          icon={CalendarClock}
          label="Scheduled"
          value={isLoading ? '--' : `${data?.scheduledPosts ?? 0}`}
        />
        <MetricCard
          icon={Activity}
          label="Connected"
          value={isLoading ? '--' : `${data?.connectedPlatforms ?? 0}/3`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Scheduled queue</CardTitle>
            <CardDescription>
              Upcoming posts stay cancelable until the worker claims them.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.scheduledQueue.length > 0 ? (
              data.scheduledQueue.map(post => (
                <div className="grid gap-3 rounded-lg border p-4" key={post.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className="rounded-md" variant="outline">
                      {formatActivityDate(post.scheduledAt)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.timezone}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{post.bodyPreview}</p>
                  <div className="flex flex-wrap gap-2">
                    {post.platforms.map(platform => (
                      <Badge
                        className="rounded-md"
                        key={platform}
                        variant="secondary"
                      >
                        {platformLabels[platform]}
                      </Badge>
                    ))}
                  </div>
                  <form action={cancelScheduledPostAction}>
                    <input name="postId" type="hidden" value={post.id} />
                    <Button
                      className="rounded-md"
                      size="sm"
                      type="submit"
                      variant="outline"
                    >
                      <CalendarX className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <div className="grid gap-3 rounded-lg border border-dashed p-5">
                <CalendarClock className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">No scheduled posts yet</p>
                <p className="text-sm text-muted-foreground">
                  Put tomorrow&apos;s post on the board before today&apos;s
                  momentum fades.
                </p>
                <Button asChild className="w-fit rounded-md" size="sm">
                  <Link href="/compose">Schedule one</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-soft">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              High-signal events refresh live when Supabase Realtime is
              connected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(data.recentActivity.length > 0
                ? data.recentActivity.map(item => ({
                    id: item.id,
                    title: item.title,
                    message: item.message ?? formatActivityDate(item.createdAt),
                    tone: 'bg-primary',
                  }))
                : emptyActivityItems
              ).map(item => (
                <div key={item.id} className="grid grid-cols-[12px_1fr] gap-3">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.tone}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-5" />
            <p className="text-sm text-muted-foreground">
              The feed is intentionally quiet until activity events exist.
              Meaningful realtime beats noisy realtime.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
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
        </div>
      </CardContent>
    </Card>
  );
}
