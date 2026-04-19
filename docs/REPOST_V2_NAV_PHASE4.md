# RE-post v2 Navigation Expansion Phase 4 - Analytics Foundations

Date: 2026-04-19

## Status

Already implemented before moving to Phase 5.

## What Is Live

- Dedicated `/analytics` route.
- Supabase-backed internal analytics API at `/api/analytics/summary`.
- React Query analytics hook.
- Realtime invalidation for post, target, job, activity, and streak changes.
- Internal publishing metrics:
  - total posts
  - published posts
  - posts by platform
  - posts over time
  - scheduled vs instant posts
  - publish success rate
  - publish failure rate
  - current streak
  - streak trend

## Honesty Boundary

External engagement analytics are not live yet. Impressions, clicks, comments,
saves, follower deltas, and provider-native engagement require real provider
connections and provider analytics API access.

## Tests

This phase remains covered by the existing verification suite:

```bash
npm run verify:schema
npm run check
npm run test:e2e -- --reporter=line
npm run build
npm audit --audit-level=high
```
