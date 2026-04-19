# RE-post v2 Navigation Expansion Phase 1 - Routing And Page Foundations

Date: 2026-04-19

## Goal

Replace dashboard placeholder navigation with real product routes and real Supabase-backed page foundations for Scheduled Posts, Analytics, and Drafts.

## Architecture Decisions

- Kept Phase 1 schema-neutral. Existing `posts`, `post_platform_targets`, `publish_jobs`, `media_assets`, `activity_events`, and `streak_state` tables already support the initial page foundations.
- Used server query modules for ownership-aware data loading through Supabase RLS-aware server clients.
- Used API routes plus TanStack Query hooks for client refreshes.
- Used one focused realtime hook for page-level invalidation across posts, targets, jobs, activity, and streak updates.
- Kept action buttons visible but non-mutating in Phase 1. Secure edit/reschedule/cancel/duplicate/delete mutations are intentionally reserved for later phases.

## Routes Added

- `/schedule`
- `/analytics`
- `/drafts`

API routes:

- `/api/scheduled-posts`
- `/api/analytics/summary`
- `/api/drafts`

## Data Sources

Scheduled Posts:

- `posts` where `schedule_mode = 'scheduled'`
- `post_platform_targets`
- `publish_jobs`
- first linked `media_assets` preview via short-lived signed Storage URL

Analytics:

- existing internal analytics aggregation from `posts`, `post_platform_targets`, `streak_events`, and dashboard activity
- provider engagement metrics are marked pending, not faked

Drafts:

- `posts` where `status = 'draft'`
- `post_platform_targets`
- first linked `media_assets` preview via short-lived signed Storage URL

## Security Notes

- Pages and APIs require an authenticated user.
- User ownership is enforced by both explicit `user_id` filters and Supabase RLS.
- Private media previews are exposed only as short-lived signed URLs.
- No provider tokens or secrets are returned to the client.

## What Works

- Sidebar navigation now points to real Schedule, Drafts, and Analytics pages.
- Header titles and active navigation state update for the new routes.
- Pages render real Supabase data with loading/refetch support.
- Realtime invalidation is wired for page-level updates.
- Playwright smoke test covers the new routes.

## Still Incomplete

- Draft edit/send/schedule/duplicate/delete mutations.
- Scheduled post view/edit/reschedule/cancel/duplicate/delete mutations.
- Server-side pagination/filter query params.
- Provider engagement analytics.
- OAuth callbacks, encrypted active token lifecycle, and real provider adapters.

## Tests

Passed:

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The Playwright smoke test signs in with a temporary confirmed Supabase user,
queues a post from Compose, and verifies Dashboard, Schedule, Drafts, Analytics,
Connections, and return-home navigation.
