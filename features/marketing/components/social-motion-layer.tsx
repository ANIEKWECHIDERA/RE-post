"use client";

import { useEffect, useState } from "react";

const signals = [
  { label: "+248", meta: "likes", className: "left-[47%] top-[18%]" },
  { label: "New comment", meta: "queued", className: "right-[5%] top-[18%]" },
  { label: "Tap", meta: "post saved", className: "left-[52%] bottom-[8%]" },
  { label: "Live", meta: "streak safe", className: "right-[7%] bottom-[12%]" },
] as const;

export function SocialMotionLayer() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    let frame = 0;

    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      setScrollProgress(maxScroll > 0 ? scrollY / maxScroll : 0);
      frame = 0;
    };

    const onScroll = () => {
      // Scroll events can fire rapidly, so the UI update is batched into a
      // single animation frame and only drives transform styles.
      if (!frame) {
        frame = requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    addEventListener("scroll", onScroll, { passive: true });

    return () => {
      removeEventListener("scroll", onScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {signals.map((signal, index) => {
        const lift = (scrollProgress - 0.18) * (index % 2 === 0 ? -90 : 90);

        return (
          <div
            className={`absolute hidden rounded-lg border border-white/30 bg-white/80 px-3 py-2 text-left shadow-soft backdrop-blur md:block ${signal.className}`}
            key={signal.label}
            style={{
              transform: `translate3d(0, ${lift}px, 0) rotate(${index % 2 === 0 ? "-2deg" : "2deg"})`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent motion-safe:animate-repost-pulse" />
              <span className="text-xs font-bold text-foreground">
                {signal.label}
              </span>
            </div>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              {signal.meta}
            </p>
          </div>
        );
      })}
      <div className="absolute left-1/2 top-[38%] hidden -translate-x-1/2 md:block">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 rounded-full border border-accent/40 motion-safe:animate-repost-tap" />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
