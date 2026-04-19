# RE-post v2 Phase 9 - Streak System

Date: 2026-04-19

## Goal

Make streaks a first-class product system. A successful publish should update a creator's daily streak in their own timezone, surface clear dashboard signals, and avoid inflated counts for multi-platform posts.

## Business Rules

- A streak counts when at least one selected platform target publishes successfully.
- A multi-platform post counts once, not once per platform.
- Scheduled posts count when they publish, not when they are queued.
- Daily boundaries use the creator timezone stored in `streak_state` or `profiles`.
- Multiple successful posts on the same local day maintain the streak but do not increment it.
- If the previous counted day was yesterday, the streak increments.
- If the previous counted day was older than yesterday, the streak restarts at `1`.

## What Was Implemented

- Added `public.record_publish_streak_success(...)` in `supabase/migrations/202604190006_repost_v2_phase9_streak_engine.sql`.
- Hardened `public.set_updated_at()` with an explicit `search_path`.
- Added worker integration so the publishing engine records a streak success after one or more targets publish.
- Added `server/streaks/rules.ts` for dashboard streak status derivation.
- Added shared streak status types in `types/streaks.ts`.
- Extended dashboard summary data with `streakStatus`.
- Added dashboard "Streak signal" UI that explains current streak state and the once-daily rule.
- Updated schema verification to include the Phase 9 streak function.
- Updated `/api/health` to report `phase: 9`.

## Database Function

`record_publish_streak_success`:

- locks the creator's `streak_state`
- computes the creator-local event date
- increments, maintains, or resets the streak
- updates longest streak
- records a `streak_events` row
- inserts a `streak_updated` activity event for realtime dashboard refresh
- returns the updated `streak_state`

## Remote Migration Status

The Supabase MCP push succeeded for all migrations:

- `repost_v2_phase2_schema`
- `repost_v2_phase4_realtime`
- `repost_v2_phase6_connection_oauth_states`
- `repost_v2_phase7_publish_claiming`
- `repost_v2_phase8_scheduling`
- `repost_v2_phase9_streak_engine`

Remote table verification shows all public app tables have RLS enabled.

## Security Advisor Status

The Phase 9 migration fixed the `function_search_path_mutable` warning for `public.set_updated_at`.

Remaining advisor warning:

- `extension_in_public`: `citext` is installed in `public`.

This should be handled in a later hardening pass because moving an extension after dependent columns exist needs a careful compatibility migration.

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
```

## Production-Ready vs Scaffolded

Production-minded foundation:

- timezone-aware daily streak calculation
- database-level locked state transition
- multi-platform posts count once
- realtime-visible activity event on streak update
- dashboard streak risk/status messaging

Still scaffolded:

- automated missed-day materialization
- streak history visualization
- recovery flows beyond dashboard copy
- full provider publishing, which is still pending OAuth callback/token exchange

## What Remains

Phase 10 should build the fuller real-time activity system:

- richer event typing and metadata display
- feed grouping/deduping
- realtime updates for scheduled queue and streak events
- better visual states for publish started/succeeded/failed/retry/streak changes
- noise controls so realtime stays useful
