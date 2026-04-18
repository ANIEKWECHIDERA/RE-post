"use client";

import {
  Activity,
  BriefcaseBusiness,
  Camera,
  CalendarClock,
  Flame,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { isSupabaseConfigured } from "@/lib/env/public";

const activityItems = [
  { label: "Phase 1 foundation started", tone: "bg-emerald-500" },
  { label: "Publishing engine planned around jobs", tone: "bg-cyan-500" },
  { label: "Streak rules drafted for creator consistency", tone: "bg-rose-500" },
];

export function CreatorDashboard() {
  const { data, isLoading } = useDashboardSummary();
  const supabaseReady = isSupabaseConfigured();

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden rounded-lg border bg-card shadow-soft">
            <CardHeader className="grid gap-4 md:grid-cols-[1fr_120px] md:items-center">
              <div>
                <Badge variant="outline" className="w-fit rounded-md border-primary/30 text-primary">
                  RE-post v2 foundation
                </Badge>
                <CardTitle className="mt-4 text-3xl font-semibold tracking-normal md:text-5xl">
                  Keep the streak alive.
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-base">
                  Plan the next post, keep platform work visible, and build the habit loop before the feed gets noisy.
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
              <Button className="rounded-md">
                <Send className="mr-2 h-4 w-4" />
                Quick compose
              </Button>
              <Button variant="outline" className="rounded-md">
                <CalendarClock className="mr-2 h-4 w-4" />
                Schedule a post
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Radio className="h-5 w-5 text-accent" />
                System status
              </CardTitle>
              <CardDescription>Phase 1 is live UI and architecture scaffolding.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Supabase env</span>
                <Badge className="rounded-md" variant={supabaseReady ? "default" : "secondary"}>
                  {supabaseReady ? "configured" : "pending"}
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
                  planned
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Flame} label="Current streak" value={isLoading ? "--" : `${data?.currentStreak ?? 0} days`} />
          <MetricCard icon={Sparkles} label="Posts this week" value={isLoading ? "--" : `${data?.postsThisWeek ?? 0}`} />
          <MetricCard icon={CalendarClock} label="Scheduled" value={isLoading ? "--" : `${data?.scheduledPosts ?? 0}`} />
          <MetricCard icon={Activity} label="Connected" value={isLoading ? "--" : `${data?.connectedPlatforms ?? 0}/3`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="rounded-lg border bg-card shadow-soft">
            <CardHeader>
              <CardTitle>Composer preview</CardTitle>
              <CardDescription>
                This is the Phase 1 shell. Phase 5 will connect uploads, validation, scheduling, and draft persistence.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Textarea
                className="min-h-36 resize-none rounded-md"
                placeholder="What are you making visible today?"
                disabled
              />
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-md">
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  Instagram
                </Badge>
                <Badge variant="secondary" className="rounded-md">
                  f Facebook
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  <BriefcaseBusiness className="mr-1 h-3.5 w-3.5" />
                  LinkedIn
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card shadow-soft">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Realtime events will land here after the schema phase.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {activityItems.map((item, index) => (
                  <div key={item.label} className="grid grid-cols-[12px_1fr] gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">Phase 1 checkpoint {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-5" />
              <p className="text-sm text-muted-foreground">
                The feed is intentionally quiet until activity events exist. Meaningful realtime beats noisy realtime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
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
