# RE-post v2 Phase 4: Dashboard Shell And Real-Time Home

Last updated: 2026-04-18

Phase status: complete in app source. Authenticated runtime verification is pending a signed-in Supabase user and applied migrations.

## What Is Live In Source

Phase 4 upgrades the creator dashboard from mocked-only UI to a Supabase-backed dashboard data path:

- server-side dashboard summary query
- authenticated `/api/dashboard/summary` endpoint
- TanStack Query dashboard hook backed by native `fetch`
- realtime invalidation hook for high-signal dashboard tables
- dashboard initial data passed from server component to client component
- empty activity states
- data-source status badge
- Supabase Realtime publication migration
- health endpoint now reports `phase: 4`

## Key Files

- `server/dashboard/queries.ts`
- `app/api/dashboard/summary/route.ts`
- `app/(app)/dashboard/page.tsx`
- `hooks/use-dashboard-summary.ts`
- `hooks/use-dashboard-realtime.ts`
- `features/dashboard/components/creator-dashboard.tsx`
- `types/dashboard.ts`
- `supabase/migrations/202604180002_repost_v2_phase4_realtime.sql`
- `scripts/verify-phase2-schema.mjs`
- `app/api/health/route.ts`

## Dashboard Data

`getDashboardSummary(userId)` reads:

- `streak_state` for current and longest streak
- `posts` for posts this week
- `posts` for upcoming scheduled posts
- `social_connections` for active connected platform count
- `activity_events` for recent activity feed items

If Supabase is unavailable or a query fails, the function returns a safe empty summary instead of leaking raw database errors.

## API Route

`GET /api/dashboard/summary`

Behavior:

- requires authenticated user
- returns `401` when unauthenticated
- returns dashboard summary for authenticated users
- uses server-side Supabase client and RLS-backed reads

## Realtime

`useDashboardRealtime` subscribes to a small set of high-signal tables:

- `activity_events` inserts
- `streak_state` updates
- `post_platform_targets` updates

When one of these changes for the authenticated user, TanStack Query invalidates `["dashboard-summary"]`.

This keeps the dashboard live without creating wasteful subscriptions across every table.

## Realtime Migration

`202604180002_repost_v2_phase4_realtime.sql` adds these tables to `supabase_realtime`:

- `activity_events`
- `streak_state`
- `post_platform_targets`
- `posts`
- `social_connections`

The app currently subscribes only to the first three; `posts` and `social_connections` are enabled for near-term dashboard summary expansion.

## Environment

A local `.env` file now exists and has all required keys populated:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOKEN_ENCRYPTION_KEY`

`TOKEN_ENCRYPTION_KEY` was generated with 32 random bytes encoded as base64url and was not printed in terminal output.

## Testing And Verification

Commands run:

```bash
npm run verify:schema
npm run check
npm run build
npm audit
```

Results:

- schema verifier passes
- typecheck passes
- lint passes
- production build passes
- npm audit reports zero vulnerabilities

Route smoke test with Supabase env present:

```text
GET /dashboard -> 200
GET /api/health -> 200
GET /api/dashboard/summary -> 401
```

Health response:

```json
{"ok":true,"app":"re-post-v2","phase":4,"supabaseConfigured":true}
```

The `401` for `/api/dashboard/summary` is expected because the smoke test is unauthenticated.

## Verification Gap

The dashboard has not yet been verified with a real signed-in user because that requires:

1. Phase 2 migrations applied to Supabase
2. an authenticated Supabase user
3. profile/streak bootstrap rows available

Once those are in place, verify:

- `/dashboard` loads the authenticated app shell
- `/api/dashboard/summary` returns user-owned data
- inserted `activity_events` refresh the feed
- `streak_state` updates refresh the streak card
- `post_platform_targets` status updates refresh dashboard state

## Production-Ready vs Scaffolded

Production-minded:

- server-side summary query
- authenticated API route
- React Query server state hook
- focused realtime invalidation
- empty dashboard states
- safe fallback on query failures
- realtime publication migration

Still pending:

- authenticated runtime verification
- real dashboard data from an applied Supabase schema
- richer empty states after composer/connections exist
- dashboard widgets for schedule and platform health beyond counts
- visual polish once real data density is known

## What Remains

Phase 5 should implement Post Composer v2:

- text input
- media upload to Supabase Storage
- media metadata extraction
- platform selector
- platform-aware warnings
- draft save
- post now / schedule controls
- preparation data for the publishing engine
