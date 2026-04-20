import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Flame,
  MessageCircle,
  MousePointerClick,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  features,
  heroStats,
  howItWorks,
  navItems,
  previewItems,
  problems,
  trustLogos,
} from "@/features/marketing/content";
import { SocialMotionLayer } from "@/features/marketing/components/social-motion-layer";
import { TestimonialMarquee } from "@/features/marketing/components/testimonial-marquee";

const featureIcons = [
  Sparkles,
  CalendarClock,
  MessageCircle,
  BarChart3,
  Radio,
  ShieldCheck,
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfdfb] text-foreground">
      <MarketingNav />
      <HeroSection />
      <TrustedBySection />
      <ProblemSection />
      <FeatureSection />
      <HowItWorksSection />
      <ProductPreviewSection />
      <TestimonialsSection />
      <WhySection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-[#fbfdfb]/90 backdrop-blur">
      <nav
        aria-label="Marketing navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
      >
        <Link className="flex items-center gap-2 focus-ring rounded-md" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
            RE
          </span>
          <span className="text-sm font-black uppercase text-foreground">
            RE-post
          </span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              className="text-sm font-medium text-foreground/70 transition hover:text-foreground focus-ring rounded-md"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden rounded-md sm:inline-flex" variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="rounded-md bg-foreground text-white hover:bg-foreground/90">
            <Link href="/sign-up">Start free</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-[78svh] overflow-hidden border-b border-foreground/10 bg-[#101312] text-white lg:min-h-[84svh]"
    >
      <Image
        alt="Creator analytics and momentum illustration"
        className="object-cover opacity-20 mix-blend-screen"
        fill
        priority
        sizes="100vw"
        src="/images/trend_12735449.png"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,19,18,0.98),rgba(12,77,60,0.78),rgba(16,19,18,0.94))]" />
      <SocialMotionLayer />
      <div className="relative z-10 mx-auto grid min-h-[78svh] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:min-h-[84svh] lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white/80 backdrop-blur">
            Creator command center for people who keep showing up
          </div>
          <h1
            className="max-w-4xl text-4xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl lg:leading-[0.98]"
            id="hero-title"
          >
            Stay visible without burning out.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
            RE-post turns drafts, schedules, platform rules, realtime activity,
            and streaks into one calm system for creators and social teams.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-md bg-accent px-6 text-base font-bold text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/sign-up">
                Start posting smarter <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-md border-white/20 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20"
              variant="outline"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <div className="mt-10 hidden max-w-2xl grid-cols-3 gap-3 sm:grid">
            {heroStats.map((stat) => (
              <div
                className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur"
                key={stat.label}
              >
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <HeroMobileCommandStrip />
        </div>
        <HeroCommandCenter />
      </div>
    </section>
  );
}

function HeroCommandCenter() {
  return (
    <div
      aria-label="RE-post product preview"
      className="relative mx-auto hidden w-full max-w-[34rem] rounded-lg border border-white/15 bg-white/10 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur lg:block"
    >
      <div className="rounded-md bg-[#fbfdfb] p-4 text-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Live today
            </p>
            <h2 className="mt-1 text-xl font-black">Creator momentum</h2>
          </div>
          <span className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            18 day streak
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {previewItems.map((item) => (
            <div className="rounded-lg border border-foreground/10 bg-white p-3" key={item.label}>
              <p className="text-xs font-semibold text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
              <p className="mt-2 text-xs text-foreground/60">{item.tone}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-foreground/10 bg-[#f1fbf7] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-bold">Launch carousel: growth notes</p>
            <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-white">
              queued
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            LinkedIn at 9:00 AM, Instagram at 12:30 PM, Facebook at 5:45 PM.
            Media passes platform checks.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {["LinkedIn", "Instagram", "Facebook"].map((platform) => (
              <span
                className="rounded-md border border-primary/20 bg-white px-2.5 py-1 text-primary"
                key={platform}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-foreground/10 bg-white p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <MousePointerClick aria-hidden className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Publish job claimed</p>
            <p className="text-xs text-muted-foreground">
              Server-side engine is processing 3 targets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMobileCommandStrip() {
  return (
    <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
            Live today
          </p>
          <p className="mt-1 text-sm font-black text-white">
            3 targets queued
          </p>
        </div>
        <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
          streak safe
        </span>
      </div>
      <div className="mt-3 flex gap-2 text-xs font-bold">
        {["LI", "IG", "FB"].map((platform) => (
          <span
            className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-white/80"
            key={platform}
          >
            {platform}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrustedBySection() {
  return (
    <section
      aria-labelledby="trusted-title"
      className="border-b border-foreground/10 bg-white px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground/70" id="trusted-title">
              Trusted by social teams at
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Placeholder brand marks. Replace with verified approvals before
              production launch.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {trustLogos.map((logo) => (
              <div
                className="rounded-lg border border-foreground/10 bg-[#fbfdfb] px-3 py-4 text-center text-sm font-black text-foreground/70"
                key={logo}
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section
      aria-labelledby="why-title"
      className="bg-[#f5fbf9] px-4 py-20 sm:px-6 lg:px-8"
      id="why"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            The real problem
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight text-foreground sm:text-5xl" id="why-title">
            Consistency is emotional infrastructure.
          </h2>
          <p className="mt-5 text-lg leading-8 text-foreground/70">
            Posting manually sounds easy until ideas, clients, formats, and
            timing all collide. RE-post gives your presence a rhythm you can
            actually keep.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {problems.map((problem, index) => (
            <div
              className="rounded-lg border border-foreground/10 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary/30"
              key={problem}
            >
              <span className="text-sm font-black text-accent">
                0{index + 1}
              </span>
              <p className="mt-3 text-xl font-black leading-7">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section
      aria-labelledby="features-title"
      className="bg-white px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
              What it does
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" id="features-title">
              The workflow for staying seen.
            </h2>
          </div>
          <Button asChild className="rounded-md md:mb-2">
            <Link href="/sign-up">Join RE-post</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = featureIcons[index];

            return (
              <article
                className="rounded-lg border border-foreground/10 bg-[#fbfdfb] p-6 shadow-soft transition hover:-translate-y-1 hover:border-secondary/35"
                key={feature.title}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-foreground text-white">
                  <Icon aria-hidden className="h-5 w-5" />
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-secondary">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-black">{feature.title}</h3>
                <p className="mt-4 text-sm leading-6 text-foreground/70">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-title"
      className="border-y border-foreground/10 bg-[#101312] px-4 py-20 text-white sm:px-6 lg:px-8"
      id="how-it-works"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-accent">
            How to use it
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" id="how-title">
            From idea to published without breaking your flow.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {howItWorks.map((step) => (
            <article
              className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur"
              key={step.step}
            >
              <span className="text-sm font-black text-accent">{step.step}</span>
              <h3 className="mt-5 text-xl font-black">{step.title}</h3>
              <p className="mt-4 text-sm leading-6 text-white/70">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreviewSection() {
  return (
    <section
      aria-labelledby="preview-title"
      className="bg-[#f5fbf9] px-4 py-20 sm:px-6 lg:px-8"
      id="preview"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            Product preview
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" id="preview-title">
            Your creator operating system, not another tab graveyard.
          </h2>
          <p className="mt-5 text-lg leading-8 text-foreground/70">
            Dashboard, composer, drafts, scheduled posts, analytics, streaks,
            and activity all point at one thing: keep your presence moving.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-md">
              <Link href="/sign-up">Get started</Link>
            </Button>
            <Button asChild className="rounded-md" variant="outline">
              <Link href="/sign-in">Open your dashboard</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-foreground/10 bg-white p-3 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-lg bg-[#101312] p-5 text-white">
              <div className="flex items-center gap-3">
                <Image
                  alt="Analytics icon"
                  className="h-12 w-12 rounded-md bg-white/10 object-contain p-2"
                  height={64}
                  src="/images/analytics_1130097.png"
                  width={64}
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
                    This week
                  </p>
                  <p className="text-2xl font-black">7 posts shipped</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {["LinkedIn thought post", "IG carousel draft", "Facebook community update"].map((item, index) => (
                  <div
                    className="flex items-center justify-between rounded-md bg-white/10 p-3"
                    key={item}
                  >
                    <span className="text-sm font-semibold">{item}</span>
                    <span className="text-xs text-white/60">
                      {index === 0 ? "posted" : "queued"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-foreground/10 bg-[#f1fbf7] p-5">
                <div className="flex items-center gap-3">
                  <Flame aria-hidden className="h-5 w-5 text-accent" />
                  <p className="font-black">Streak protected</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  One successful publish keeps the daily creator streak alive.
                </p>
              </div>
              <div className="rounded-lg border border-foreground/10 bg-white p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 aria-hidden className="h-5 w-5 text-primary" />
                  <p className="font-black">Media checks passed</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  Platform dimensions, file type, and metadata are recorded
                  before publishing starts.
                </p>
              </div>
              <div className="rounded-lg border border-foreground/10 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Realtime
                </p>
                <p className="mt-2 font-black">Activity updates as jobs move.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section
      aria-labelledby="proof-title"
      className="bg-white py-20"
      id="proof"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            Social manager energy
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" id="proof-title">
            Built for people whose job is staying visible.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Placeholder testimonial seed content. Replace with approved customer
            quotes before production launch.
          </p>
        </div>
      </div>
      <div className="mt-10 space-y-2">
        <TestimonialMarquee direction="left" />
        <TestimonialMarquee direction="right" offset={5} />
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section
      aria-labelledby="different-title"
      className="bg-[#f5fbf9] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
            Why RE-post
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" id="different-title">
            Not a Buffer clone. A consistency engine.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Streaks make discipline visible.",
            "Drafts turn creative mess into inventory.",
            "Platform-aware checks reduce silent failures.",
            "Server-side publishing keeps secrets out of the browser.",
          ].map((item) => (
            <div className="rounded-lg border border-foreground/10 bg-white p-5 shadow-soft" key={item}>
              <p className="text-lg font-black leading-7">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-[#101312] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-accent">
          Your next post is already part of the streak
        </p>
        <h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
          Build the habit your audience can feel.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
          Show up with less chaos, better timing, stronger systems, and the
          kind of consistency people start to recognize.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-md bg-accent px-6 text-base font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/sign-up">Start free</Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-md border-white/20 bg-white/10 px-6 text-base font-bold text-white hover:bg-white/20"
            variant="outline"
          >
            <a href="#preview">See the command center</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Link className="flex items-center gap-2 focus-ring rounded-md" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
              RE
            </span>
            <span className="text-sm font-black uppercase">RE-post</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            A creator-first command center for showing up consistently across
            LinkedIn, Facebook, and Instagram.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <FooterLinks
            title="Product"
            links={[
              ["Dashboard", "/dashboard"],
              ["Drafts", "/drafts"],
              ["Schedule", "/schedule"],
            ]}
          />
          <FooterLinks
            title="Company"
            links={[
              ["How it works", "#how-it-works"],
              ["Proof", "#proof"],
              ["Preview", "#preview"],
            ]}
          />
          <FooterLinks
            title="Legal"
            links={[
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
              ["Data deletion", "/data-deletion"],
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  links,
  title,
}: {
  links: [string, string][];
  title: string;
}) {
  return (
    <div>
      <h3 className="font-black">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              className="text-muted-foreground transition hover:text-foreground focus-ring rounded-md"
              href={href}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
