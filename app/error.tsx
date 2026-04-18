"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-md rounded-lg border bg-card p-6 shadow-soft">
        <p className="text-sm font-medium text-accent">Something slipped.</p>
        <h1 className="mt-2 text-2xl font-semibold">The command center needs a refresh.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We keep provider and system errors normalized before they reach users. This screen is the fallback for anything unexpected.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{error.digest ?? error.message}</p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}
