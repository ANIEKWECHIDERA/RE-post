# RE-post v2 Marketing Landing Page Phase 1

Date: 2026-04-19

## Scope

Built the public root marketing page for RE-post v2. The authenticated app still
lives under `/dashboard`, `/compose`, `/schedule`, `/drafts`, `/analytics`, and
`/connections`; `/` now serves the conversion-focused landing experience instead
of redirecting to the dashboard.

## Architecture Decisions

- Marketing UI lives under `features/marketing` so Tailwind already scans the
  classes through the existing project configuration.
- Static marketing copy, placeholder trust marks, and placeholder testimonials
  live in `features/marketing/content.ts` as typed content data.
- The landing route uses mostly server-rendered React. The only client-side
  marketing component is the social motion layer, which batches scroll updates
  through `requestAnimationFrame`.
- Testimonial motion is CSS-only and duplicates the row data to create a
  seamless loop without JavaScript timers.
- Existing public image assets are used through `next/image` to avoid adding
  remote media dependencies or increasing setup friction.

## Sections Implemented

- Hero with creator-command-center positioning, primary CTA, secondary CTA, and
  live product-style preview.
- Social activity motion layer with engagement chips and tap pulse effects.
- Trusted-by section using placeholder trust-logo content.
- Problem/emotional tension section.
- Feature/value section.
- How it works section explaining the user journey.
- Product preview section with dashboard, streak, media, and realtime concepts.
- Two-row testimonial carousel with alternating directions.
- Differentiation section.
- Final CTA.
- Footer.

## Placeholder Content

The trust-logo names and testimonial quotes are development seed content only.
They are clearly marked in code comments and page microcopy as requiring verified
brand/customer approval before production launch.

## Performance Notes

- No animation library was added.
- Repeating motion uses CSS transforms.
- Scroll-linked social motion uses one passive scroll listener and
  `requestAnimationFrame`, then updates transform-only styles.
- `prefers-reduced-motion` is respected in both component logic and global CSS.

## Accessibility Notes

- The page uses semantic sections with labelled headings.
- CTAs are links/buttons with visible text labels.
- Animated testimonial duplicates are marked `aria-hidden`.
- Reduced-motion users get a non-looping, low-motion experience.

## Checks

Passed:

- `npm run check`
- `npm run build`
- Playwright desktop smoke at 1440 x 1000:
  - root page loads
  - no console errors
  - no horizontal overflow
  - next section is visible below the hero
  - both testimonial carousel rows report active alternating animations
- Playwright mobile smoke at 390 x 844:
  - root page loads
  - no horizontal overflow
  - hero text and CTAs fit
  - compact mobile command strip renders
  - next section is visible below the hero
