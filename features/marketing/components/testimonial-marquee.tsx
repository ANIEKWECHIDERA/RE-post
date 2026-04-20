import { testimonials } from "@/features/marketing/content";
import { cn } from "@/lib/utils";

type TestimonialMarqueeProps = {
  direction: "left" | "right";
  offset?: number;
};

function TestimonialCard({
  quote,
  name,
  role,
}: (typeof testimonials)[number]) {
  return (
    <figure className="mx-2 w-[19rem] shrink-0 rounded-lg border border-foreground/10 bg-white/90 p-5 shadow-soft md:w-[24rem]">
      <blockquote className="text-sm leading-6 text-foreground/85">
        <span aria-hidden>&quot;</span>
        {quote}
        <span aria-hidden>&quot;</span>
      </blockquote>
      <figcaption className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          SMM
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialMarquee({
  direction,
  offset = 0,
}: TestimonialMarqueeProps) {
  const row = testimonials.slice(offset).concat(testimonials.slice(0, offset));
  const doubled = [...row, ...row];

  return (
    <div
      className="group overflow-hidden py-2"
      aria-label={`Social media manager testimonials moving ${direction}`}
    >
      <div
        className={cn(
          "flex w-max motion-safe:group-hover:[animation-play-state:paused]",
          direction === "left"
            ? "motion-safe:animate-repost-marquee-left"
            : "motion-safe:animate-repost-marquee-right",
        )}
      >
        {doubled.map((testimonial, index) => (
          <div
            // Duplicating the row creates a seamless CSS-only loop without JS
            // timers, keeping the marketing page smooth and inexpensive.
            aria-hidden={index >= row.length}
            key={`${testimonial.name}-${index}`}
          >
            <TestimonialCard {...testimonial} />
          </div>
        ))}
      </div>
    </div>
  );
}
