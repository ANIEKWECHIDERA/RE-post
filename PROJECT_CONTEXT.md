# RE-post Project Context

Last updated: 2026-04-18

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
npm run dev
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

## Environment Variables

`.env` is ignored by git. Use `.env.example` as the safe template.

Current variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOKEN_ENCRYPTION_KEY=
```

Notes:

- The app boots without Supabase keys in Phase 1.
- `/api/health` returns `supabaseConfigured: false` until public Supabase env vars are present.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used in server-only contexts.
- `TOKEN_ENCRYPTION_KEY` is reserved for future third-party token encryption.

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
- `app/(auth)/sign-in/page.tsx`: Sign-in route.
- `app/(auth)/sign-up/page.tsx`: Sign-up route.
- `components/layout/app-shell.tsx`: Main app shell/sidebar/header.
- `components/auth/auth-form.tsx`: Sign-in/sign-up form bound to server actions.
- `components/auth/supabase-setup-required.tsx`: No-env setup blocker.
- `features/dashboard/components/creator-dashboard.tsx`: Current Phase 1 dashboard.
- `components/providers/app-providers.tsx`: TanStack Query provider.
- `stores/composer-store.ts`: Zustand composer UI store.
- `schemas/env.ts`: Zod env schemas.
- `schemas/post.ts`: Composer draft validation schema.
- `schemas/media.ts`: Media metadata schema and platform media target constants.
- `lib/fetch/api-client.ts`: Fetch-only API helper.
- `lib/errors/app-error.ts`: Shared error normalization.
- `lib/supabase/client.ts`: Browser Supabase client factory.
- `lib/supabase/server.ts`: Server Supabase client factory.
- `lib/supabase/middleware.ts`: Supabase session refresh helper.
- `proxy.ts`: Next.js 16 request proxy for session refresh.
- `server/publishing/readiness.ts`: Server-only publishing readiness scaffold.
- `server/auth/actions.ts`: Sign up, sign in, and sign out server actions.
- `server/auth/session.ts`: Server-side user lookup.
- `server/profiles/bootstrap.ts`: Profile/streak bootstrap repair helper.
- `server/dashboard/queries.ts`: Server-side dashboard summary query.
- `app/api/dashboard/summary/route.ts`: Authenticated dashboard summary endpoint.
- `hooks/use-dashboard-summary.ts`: TanStack Query dashboard summary hook.
- `hooks/use-dashboard-realtime.ts`: Focused Supabase Realtime dashboard invalidation hook.
- `features/composer/components/post-composer.tsx`: Composer UI for text, platforms, media, timing, and warnings.
- `features/composer/media-validation.ts`: Browser-side media metadata inspection and platform warning logic.
- `server/composer/actions.ts`: Server action that creates posts, uploads media, creates platform targets, queues publish jobs, and logs activity.
- `app/api/health/route.ts`: Health endpoint.
- `supabase/migrations/202604180001_repost_v2_phase2_schema.sql`: Phase 2 schema/RLS/storage migration.
- `supabase/migrations/202604180002_repost_v2_phase4_realtime.sql`: Realtime publication migration for dashboard tables.
- `supabase/tests/phase2_rls_smoke.sql`: Ownership/RLS smoke test for a real Supabase database.
- `scripts/verify-phase2-schema.mjs`: Local schema coverage verifier.
- `types/database.ts`: Manual Phase 2 Supabase database type surface.
- `docs/REPOST_V2_PHASE0.md`: Architecture and migration plan.
- `docs/REPOST_V2_PHASE1.md`: Phase 1 implementation record.
- `docs/REPOST_V2_PHASE2.md`: Phase 2 schema implementation record.
- `docs/REPOST_V2_PHASE3.md`: Phase 3 auth implementation record.
- `docs/REPOST_V2_PHASE4.md`: Phase 4 dashboard/realtime implementation record.
- `docs/REPOST_V2_PHASE5.md`: Phase 5 composer implementation record.

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

- Supabase env vars are present in `.env`, but migrations still need to be applied to the Supabase project before authenticated dashboard data can be verified.
- Auth routes and server actions are implemented, but live sign up/sign in requires Supabase env vars and the Phase 2 migration applied.
- Dashboard data path is implemented, but unauthenticated smoke tests correctly return `401` for `/api/dashboard/summary`.
- Realtime subscription code and publication migration are implemented, but live realtime verification needs an authenticated user and applied migrations.
- Composer UI and media upload server action are implemented, but live persistence verification needs a linked Supabase project, applied migrations, and an authenticated user.
- Social connections are not implemented yet.
- Publishing engine is scaffolded only; no provider publishing happens yet.
- Scheduling, streak calculation, activity events, and analytics are pending later phases.

## Next Phase

Phase 6 should implement:

- social connection records and UI
- provider-specific connection scaffolding
- secure third-party token handling architecture
- OAuth live vs pending states
- connection lifecycle validation

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
