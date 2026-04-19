# RE-post v2 Phase 11 - Basic Analytics Scaffolding

Date: 2026-04-19

## Goal

Add a lean analytics foundation that helps creators see output, consistency, platform spread, and publish reliability without pretending the product has a full analytics warehouse yet.

## What Was Implemented

- Added analytics types to `types/dashboard.ts`.
- Extended `server/dashboard/queries.ts` with a live `analytics` summary.
- Added exact counts for:
  - total posts
  - instant posts
  - scheduled posts
  - published posts
- Added publish target success/failure counts and success rate.
- Added platform breakdown for LinkedIn, Facebook, and Instagram.
- Added six-week post volume data.
- Added recent streak history from `streak_events`.
- Added an "Analytics pulse" dashboard section with:
  - total posts
  - publish success rate
  - instant vs scheduled split
  - posts by week
  - platform spread
  - streak history
- Updated `/api/health` to report `phase: 11`.

## Data Strategy

Phase 11 uses live reads from operational tables:

- `posts`
- `post_platform_targets`
- `streak_events`

This keeps the build lean and honest while user volume is low. The existing `analytics_daily_rollups` table remains ready for a later scheduled aggregation worker when the app needs historical analytics at scale.

## Current Metrics

Live:

- total posts
- instant posts
- scheduled posts
- published posts
- successful platform targets
- failed platform targets
- publish success rate
- posts by week
- platform breakdown
- recent streak history

Pending:

- provider-native impressions, likes, comments, shares, saves, and clicks
- per-post performance over time
- daily rollup worker
- exportable analytics
- richer streak charts

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
```

## Production-Ready vs Scaffolded

Production-minded foundation:

- typed analytics contract
- exact headline counts
- no fake provider analytics
- clear dashboard states
- reusable data structure for future charts

Still scaffolded:

- rollup population
- dedicated analytics page
- provider-native performance metrics
- trend comparisons and deltas
- long-range historical charts

## What Remains

Phase 12 should harden and clean up the app:

- remove dead code
- review security and RLS
- normalize remaining errors
- verify fetch-only data layer
- verify realtime and scheduling behavior
- polish mobile and accessibility basics
- update setup, architecture, migration, and limitation notes
