# RE-post Project Context

Last updated: 2026-04-19

This is the living technical context document for RE-post. Update it on every meaningful iteration so a developer or coding agent can understand the project without rediscovering the codebase.

## Current State

RE-post is now being rebuilt as RE-post v2: a lean, production-minded creator command center for creating, optimizing, scheduling, publishing, and tracking social posts across LinkedIn, Facebook, and Instagram.

The active root app is a Next.js + TypeScript application. The old Express/EJS v1 prototype has been retired from the active source tree.

Current completed phases:

- Phase 0: Discovery, cleanup, and architecture plan. See `docs/REPOST_V2_PHASE0.md`.
- Phase 1: Next.js foundation and project setup. See `docs/REPOST_V2_PHASE1.md`.
- Phase 2: Supabase schema, RLS, storage policies, and database type surface. See `docs/REPOST_V2_PHASE2.md`.
- Phase 3: Supabase Auth and protected user account system. See `docs/REPOST_V2_PHASE3.md`.
- Phase 4: Supabase-backed dashboard data path and realtime home scaffolding. See `docs/REPOST_V2_PHASE4.md`.
- Phase 5: Post Composer v2 with media validation, storage upload path, targets, and publish job creation. See `docs/REPOST_V2_PHASE5.md`.
- Phase 6: Social connection architecture, token encryption, and OAuth state scaffolding. See `docs/REPOST_V2_PHASE6.md`.
- Phase 7: Backend-controlled publishing engine, worker route, job claiming, attempts, retries, and provider adapter boundary. See `docs/REPOST_V2_PHASE7.md`.
- Phase 8: Timezone-aware scheduling, cancelable scheduled queue, worker cron scaffold, and safe reprocessing guards. See `docs/REPOST_V2_PHASE8.md`.
- Phase 9: Creator timezone-aware streak engine, streak activity events, dashboard streak status, and remote migration push. See `docs/REPOST_V2_PHASE9.md`.
- Phase 10: Real-time activity feed presentation, cache-prepend updates, throttled dashboard invalidation, and richer composer events. See `docs/REPOST_V2_PHASE10.md`.
- Phase 11: Basic analytics scaffolding for total posts, platform spread, weekly output, streak history, and publish success rate. See `docs/REPOST_V2_PHASE11.md`.
- Phase 12: QA, hardening, setup docs, advisor-driven indexes, final checks, and cleanup. See `docs/REPOST_V2_PHASE12.md`.

## Product Direction

RE-post v2 should feel like "Strava for creators":

- Consistency and streaks are first-class.
- Publishing should be secure, backend-controlled, retryable, and auditable.
- The dashboard should feel real-time, calm, modern, and screenshot-worthy.
- Provider differences should be respected instead of flattened into one naive posting model.
- Incomplete features must be marked honestly as scaffolded or pending.

## Active Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for transient UI state
- TanStack Query for server state
- Zod validation
- native `fetch` only

Backend/platform target:

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Supabase RLS
- Next.js route handlers/server-only modules
- Supabase Edge Functions or a server-only worker for scheduled publishing when needed

## Commands

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev:all
```

Build:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Run typecheck and lint:

```bash
npm run check
```

Verify Phase 2 schema coverage:

```bash
npm run verify:schema
```

Run the Playwright authenticated smoke test:

```bash
npm run test:e2e
```

The smoke test requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It creates a temporary confirmed auth user, signs in through the UI, navigates dashboard/compose/connections, queues a text post, and deletes the user afterward.

## Environment Variables

`.env` is ignored by git. Use `.env.example` as the safe template.

Current variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOKEN_ENCRYPTION_KEY=
SUPABASE_ACCESS_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
PUBLISH_WORKER_SECRET=
PUBLISH_WORKER_URL=
PUBLISH_PROVIDER_MODE=disabled
```

Notes:

- The app boots without Supabase keys in Phase 1.
- `/api/health` returns `supabaseConfigured: false` until public Supabase env vars are present.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used in server-only contexts.
- `TOKEN_ENCRYPTION_KEY` is reserved for future third-party token encryption.
- `PUBLISH_WORKER_SECRET` protects the server-side publish worker endpoint.
- `PUBLISH_WORKER_URL` is used by the optional Supabase Edge Function cron target.
- `PUBLISH_PROVIDER_MODE=disabled` is the safe default; use `mock` only for engine flow testing.

## Active Structure

```text
app/
|-- (auth)/
|-- (app)/
|-- api/
|-- globals.css
|-- layout.tsx
|-- page.tsx
components/
|-- layout/
|-- providers/
`-- ui/
features/
hooks/
lib/
|-- env/
|-- errors/
|-- fetch/
`-- supabase/
schemas/
scripts/
server/
stores/
supabase/
|-- migrations/
`-- tests/
types/
docs/
public/images/
```

## Key Files

- `app/page.tsx`: Root entry route that redirects to `/dashboard`.
- `app/(app)/layout.tsx`: Protected app route boundary.
- `app/(app)/dashboard/page.tsx`: Authenticated dashboard page.
- `app/(app)/compose/page.tsx`: Authenticated post composer page.
- `app/(app)/connections/page.tsx`: Authenticated social connections page.
- `app/(auth)/sign-in/page.tsx`: Sign-in route.
- `app/(auth)/sign-up/page.tsx`: Sign-up route.
- `components/layout/app-shell.tsx`: Main app shell/sidebar/header.
- `components/layout/app-shell-path-controls.tsx`: Client-side path-aware shell title and active navigation state.
- `components/auth/auth-form.tsx`: Sign-in/sign-up form bound to server actions.
- `components/auth/supabase-setup-required.tsx`: No-env setup blocker.
- `features/dashboard/components/creator-dashboard.tsx`: Current Phase 1 dashboard.
- `features/dashboard/activity.ts`: Activity event presentation, tone, status, and metadata helpers.
- `components/providers/app-providers.tsx`: TanStack Query provider.
- `stores/composer-store.ts`: Zustand composer UI store.
- `schemas/env.ts`: Zod env schemas.
- `schemas/post.ts`: Composer draft validation schema.
- `schemas/scheduling.ts`: Scheduled-post cancellation validation schema.
- `schemas/media.ts`: Media metadata schema and platform media target constants.
- `lib/fetch/api-client.ts`: Fetch-only API helper.
- `lib/errors/app-error.ts`: Shared error normalization.
- `lib/supabase/client.ts`: Browser Supabase client factory.
- `lib/supabase/server.ts`: Server Supabase client factory.
- `lib/supabase/admin.ts`: Server-only Supabase service-role client for worker code.
- `lib/supabase/middleware.ts`: Supabase session refresh helper.
- `proxy.ts`: Next.js 16 request proxy for session refresh.
- `server/publishing/readiness.ts`: Server-only publishing readiness scaffold.
- `server/publishing/engine.ts`: Phase 7 job-backed publishing engine.
- `server/publishing/provider-adapters.ts`: Provider adapter boundary with disabled/mock modes.
- `server/publishing/errors.ts`: Normalized provider error types.
- `server/scheduling/time.ts`: IANA timezone-aware wall-clock to UTC conversion.
- `server/scheduling/actions.ts`: Scheduled-post cancellation server action.
- `server/streaks/rules.ts`: Dashboard streak status and risk messaging rules.
- `server/auth/actions.ts`: Sign up, sign in, and sign out server actions.
- `server/auth/session.ts`: Server-side user lookup.
- `server/profiles/bootstrap.ts`: Profile/streak bootstrap repair helper.
- `server/dashboard/queries.ts`: Server-side dashboard summary and live analytics query.
- `app/api/dashboard/summary/route.ts`: Authenticated dashboard summary endpoint.
- `hooks/use-dashboard-summary.ts`: TanStack Query dashboard summary hook.
- `hooks/use-dashboard-realtime.ts`: Focused Supabase Realtime cache prepend and throttled dashboard invalidation hook.
- `app/api/publish/run/route.ts`: Secret-protected publishing worker endpoint.
- `features/composer/components/post-composer.tsx`: Composer UI for text, platforms, media, timing, and warnings.
- `features/composer/media-validation.ts`: Browser-side media metadata inspection and platform warning logic.
- `server/composer/actions.ts`: Server action that creates posts, uploads media, creates platform targets, queues publish jobs, and logs activity.
- `server/connections/providers.ts`: Provider-specific connection config and readiness.
- `server/connections/actions.ts`: OAuth state preparation and connection revoke actions.
- `server/security/token-vault.ts`: Server-only AES-GCM helper for provider token encryption.
- `app/api/health/route.ts`: Health endpoint.
- `supabase/migrations/202604180001_repost_v2_phase2_schema.sql`: Phase 2 schema/RLS/storage migration.
- `supabase/migrations/202604180002_repost_v2_phase4_realtime.sql`: Realtime publication migration for dashboard tables.
- `supabase/migrations/202604190003_repost_v2_phase6_connection_oauth_states.sql`: OAuth state/PKCE storage migration.
- `supabase/migrations/202604190004_repost_v2_phase7_publish_claiming.sql`: Publish job claiming RPC with row locking.
- `supabase/migrations/202604190005_repost_v2_phase8_scheduling.sql`: Scheduled-post cancellation function and scheduler indexes.
- `supabase/migrations/202604190006_repost_v2_phase9_streak_engine.sql`: Streak transition function and search-path hardening.
- `supabase/migrations/202604190007_repost_v2_phase12_hardening.sql`: Advisor-driven foreign-key indexes.
- `supabase/functions/publish-worker/index.ts`: Optional Supabase Edge Function cron target that forwards to the Next.js worker.
- `supabase/tests/phase2_rls_smoke.sql`: Ownership/RLS smoke test for a real Supabase database.
- `scripts/verify-phase2-schema.mjs`: Local schema coverage verifier.
- `tests/e2e/repost-smoke.spec.ts`: Playwright authenticated smoke test for dashboard, composer, and navigation.
- `types/database.ts`: Manual Phase 2 Supabase database type surface.
- `types/dashboard.ts`: Dashboard, scheduled queue, activity, and analytics summary types.
- `types/streaks.ts`: Shared streak status types.
- `docs/REPOST_V2_PHASE0.md`: Architecture and migration plan.
- `docs/REPOST_V2_PHASE1.md`: Phase 1 implementation record.
- `docs/REPOST_V2_PHASE2.md`: Phase 2 schema implementation record.
- `docs/REPOST_V2_PHASE3.md`: Phase 3 auth implementation record.
- `docs/REPOST_V2_PHASE4.md`: Phase 4 dashboard/realtime implementation record.
- `docs/REPOST_V2_PHASE5.md`: Phase 5 composer implementation record.
- `docs/REPOST_V2_PHASE6.md`: Phase 6 social connections implementation record.
- `docs/REPOST_V2_PHASE7.md`: Phase 7 publishing engine implementation record.
- `docs/REPOST_V2_PHASE8.md`: Phase 8 scheduling implementation record.
- `docs/REPOST_V2_PHASE9.md`: Phase 9 streak implementation record.
- `docs/REPOST_V2_PHASE10.md`: Phase 10 realtime activity implementation record.
- `docs/REPOST_V2_PHASE11.md`: Phase 11 analytics scaffolding implementation record.
- `docs/REPOST_V2_PHASE12.md`: Phase 12 hardening implementation record.
- `docs/SETUP.md`: Current setup, environment, migration, worker, and limitation notes.

## Security Principles

- Never expose provider tokens to the client.
- Keep publishing logic server-side.
- Validate inputs with Zod at every boundary.
- Use Supabase RLS for final ownership enforcement once schema exists.
- Use private Supabase Storage buckets and explicit policies.
- Normalize provider errors before showing anything to users.
- Keep service role access server-only and narrow.
- Do not store unnecessary PII.
- Use native `fetch`; do not add axios.

## Current Known Limitations

- Supabase env vars are present in `.env`, and Phases 2, 4, 6, 7, 8, 9, and 12 have been applied remotely through Supabase MCP.
- Auth routes and server actions are implemented. Playwright now covers confirmed-user sign-in and app navigation against the remote project.
- Dashboard data path is implemented, but unauthenticated smoke tests correctly return `401` for `/api/dashboard/summary`.
- Realtime subscription code and publication migration are implemented, but live realtime verification needs an authenticated user.
- Composer UI and media upload server action are implemented, but live persistence verification needs an authenticated user.
- Social connection architecture is implemented, but provider redirect/callback token exchange is pending.
- Publishing engine job processing is implemented, but real provider API calls are disabled until OAuth token exchange is complete.
- `POST /api/publish/run` exists and requires `PUBLISH_WORKER_SECRET`; it is ready for cron/worker invocation.
- Scheduling is implemented in source with timezone-aware conversion and cancellation.
- Supabase CLI token push remains blocked by the invalid `SUPABASE_ACCESS_TOKEN`, but Supabase MCP migration apply now works and was used successfully.
- Streak calculation is implemented, but automated missed-day materialization and streak history visualization are pending later phases.
- Real-time activity feed is implemented on the dashboard, but a dedicated activity history page, event grouping, and user-level noise controls are pending.
- Basic analytics are implemented from live operational tables, but provider-native performance metrics and scheduled rollups are pending.
- Supabase security advisor currently reports `extension_in_public` for `citext`; the mutable function search path warning was fixed in Phase 9.
- Supabase performance advisor foreign-key index warnings were addressed in Phase 12. Unused-index warnings are expected while the database has no real workload.

## Next Phase

Recommended next work:

- provider OAuth callbacks
- encrypted active token persistence
- real LinkedIn/Facebook/Instagram provider adapters
- Supabase cron deployment for the publish worker
- end-to-end tests with a real Supabase auth user
- provider-native analytics ingestion

## Documentation Maintenance Rules

- Update this file whenever routes, env vars, setup steps, dependencies, integrations, deployment behavior, data flow, known issues, or project structure change.
- Add or update phase docs after each phase.
- Keep "Current Known Limitations" honest.
- Do not document intended behavior as if it already works.
- Do not store secrets, access tokens, account IDs, or refresh tokens in docs.

## Change Log

### 2026-04-18

- Created the initial v1 context document.
- Added `docs/REPOST_V2_PHASE0.md` with v2 discovery, target architecture, migration strategy, assumptions, and risks.
- Completed Phase 1 by converting the root app to Next.js + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query + Supabase scaffolding.
- Retired the old Express/EJS/static prototype files from the active source tree.
- Added `.env.example`, health route, creator dashboard shell, env validation, Supabase boundaries, fetch utility, and server-only publishing readiness scaffold.
- Completed Phase 2 in source by adding Supabase schema migration, RLS policies, private storage bucket rules, ownership smoke test SQL, database types, and schema verification script.
- Completed Phase 3 in source by adding Supabase Auth server actions, auth forms, protected dashboard route, profile bootstrap repair, sign out, and route smoke tests.
- Completed Phase 4 in source by adding dashboard summary queries, authenticated dashboard summary API, React Query dashboard hook, focused realtime invalidation, realtime publication migration, and generated local `TOKEN_ENCRYPTION_KEY`.
- Completed Phase 5 in source by adding protected composer UI, media metadata inspection, platform-aware warnings, Supabase Storage upload action, post/target/job creation, and composer docs.
- Completed Phase 6 in source by adding provider readiness UI, connection queries/actions, OAuth state migration, server-only token vault, and social connection docs.

### 2026-04-19

- Completed Phase 7 in source by adding service-role publishing engine code, publish job claiming migration, provider adapter boundary, normalized publish errors, secret-protected worker endpoint, worker env validation, and Phase 7 docs.
- Attempted Supabase migration push again; it remains blocked because the current `SUPABASE_ACCESS_TOKEN` is not accepted by the Supabase CLI as a valid `sbp_...` personal access token.
- Confirmed the Claude MCP command is not installed in this shell, so Supabase MCP push could not be used from this environment.
- Completed Phase 8 in source by adding timezone-aware scheduled time conversion, cancelable scheduled queue UI, cancellation RPC/action, scheduler Edge Function scaffold, worker publishability guard, scheduler indexes, and Phase 8 docs.
- Added and authenticated the Codex Supabase MCP server globally; current session visibility still requires a reload before Supabase MCP tools appear to this agent runtime.
- Applied Phases 2, 4, 6, 7, 8, and 9 migrations remotely through Supabase MCP.
- Completed Phase 9 in source by adding database-backed streak transitions, publishing-engine streak recording, dashboard streak status messaging, search-path hardening, and Phase 9 docs.
- Completed Phase 10 in source by adding typed activity presentation, dashboard feed metadata, realtime cache prepending, throttled dashboard invalidation, post/social realtime refreshes, composer post/media activity events, and Phase 10 docs.
- Completed Phase 11 in source by adding live dashboard analytics for post totals, platform spread, weekly output, streak history, publish success rate, scheduled vs instant posts, and Phase 11 docs.
- Completed Phase 12 by adding advisor-driven hardening indexes, applying the Phase 12 migration remotely, adding setup docs, cleaning stale product copy, adding `npm run dev:all`, reviewing Supabase advisors, and running final verification/build/audit checks.
- Added a Playwright authenticated smoke test that creates a temporary confirmed Supabase user, signs in through the UI, queues a text post, navigates the app, and cleans up the user.
- Re-tested with Playwright MCP, fixed path-aware shell titles/navigation, pinned dashboard date formatting to avoid hydration mismatches, added the favicon metadata/asset, and hardened E2E waits for remote-backed dev runs.
