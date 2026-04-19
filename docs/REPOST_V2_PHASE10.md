# RE-post v2 Phase 10 - Real-Time Activity System

Date: 2026-04-19

## Goal

Make the dashboard activity feed feel alive and useful without creating noisy subscriptions or over-fetching. Activity should explain what changed, why it matters, and whether the user needs to do anything.

## What Was Implemented

- Added typed activity presentation helpers in `features/dashboard/activity.ts`.
- Extended dashboard activity items with stored metadata from `activity_events`.
- Increased the dashboard activity window from 8 to 12 high-signal events.
- Added visual activity states for:
  - workspace bootstrap
  - social connection changes
  - media upload/validation
  - post creation/update
  - scheduled posts
  - publish queued/started/succeeded/failed
  - retry scheduled
  - streak updated
- Updated the activity feed UI with icons, status chips, metadata labels, and stable spacing.
- Added immediate cache prepending for new realtime activity inserts.
- Added throttled dashboard invalidation so metrics refresh without one refetch per event burst.
- Added realtime invalidation for `posts` and `social_connections` updates in addition to activity, streak, and target updates.
- Added `post_created` and aggregate `media_uploaded` activity events in the composer server action.
- Updated `/api/health` to report `phase: 10`.

## Real-Time Strategy

The dashboard still uses one server-state query: `dashboard-summary`.

Supabase Realtime listens to a narrow set of high-signal tables:

- `activity_events` inserts
- `streak_state` updates
- `post_platform_targets` updates
- `posts` updates
- `social_connections` updates

New activity events are inserted directly into the React Query cache for instant feedback. A short 350ms throttle then invalidates the dashboard query so counts, queue state, and streak state converge with the database.

This keeps the UX live without creating one subscription per widget.

## Event Noise Rules

The feed should remain calm:

- Activity events are capped to 12 on the dashboard.
- Composer upload events are aggregated by count instead of one event per file.
- Realtime subscriptions target high-signal tables only.
- Detailed provider attempt logs stay in `publish_attempts`, not the main feed.

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
```

## Production-Ready vs Scaffolded

Production-minded foundation:

- typed event presentation
- realtime cache prepend for immediate activity
- throttled refetch for consistency
- richer composer activity logging
- dashboard feed states for publish/streak/retry/schedule events

Still scaffolded:

- dedicated activity page
- event grouping by post/session
- toast/notification layer
- provider-specific activity metadata once real OAuth publishing is live
- user controls for muting noisy event categories

## What Remains

Phase 11 should build basic analytics scaffolding:

- total posts
- posts by platform
- posts by week
- streak history
- publish success/failure rate
- scheduled vs instant posts
