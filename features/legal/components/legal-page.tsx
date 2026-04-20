import Link from 'next/link';

import type { LegalSection } from '@/features/legal/content';

type LegalPageProps = {
  description: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
  title: string;
};

export function LegalPage({
  description,
  effectiveDate,
  sections,
  title,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#fbfdfb] text-foreground">
      <header className="border-b border-foreground/10 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            className="flex items-center gap-2 focus-ring rounded-md"
            href="/"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
              RE
            </span>
            <span className="text-sm font-black uppercase">RE-post</span>
          </Link>
          <Link
            className="rounded-md border border-foreground/10 px-3 py-2 text-sm font-bold text-foreground/70 transition hover:text-foreground focus-ring"
            href="/sign-up"
          >
            Start free
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
          Legal
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-foreground/70">
          {description}
        </p>
        <p className="mt-4 text-sm font-semibold text-muted-foreground">
          Effective date: {effectiveDate}
        </p>

        <div className="mt-10 space-y-6">
          {sections.map(section => (
            <section
              className="rounded-lg border border-foreground/10 bg-white p-6 shadow-soft"
              key={section.title}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.body.map(paragraph => (
                  <p
                    className="text-sm leading-7 text-foreground/72"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* <div className="mt-10 rounded-lg border border-primary/20 bg-primary/10 p-5">
          <p className="text-sm leading-6 text-foreground/76">
            These pages are operational product policies for launch readiness.
            Have counsel review them before relying on them as final legal
            documents.
          </p>
        </div> */}
      </article>
    </main>
  );
}
