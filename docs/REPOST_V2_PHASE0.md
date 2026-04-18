# RE-post v2 Phase 0: Discovery, Cleanup, And Architecture Plan

Last updated: 2026-04-18

Phase status: complete as architecture/discovery. No runtime migration has been performed yet.

## Goal

RE-post v2 should become a lean, production-minded creator command center for creating, optimizing, scheduling, publishing, and tracking posts across LinkedIn, Facebook, and Instagram.

The product direction is closer to "Strava for creators" than a generic posting dashboard:

- Consistency is a first-class product loop.
- Streaks and activity history motivate daily/weekly publishing.
- Publishing is backend-controlled, observable, retryable, and auditable.
- The dashboard should feel live, clean, and creator-native.
- The architecture should be secure and small enough to evolve without becoming a brittle platform clone.

## Phase 0 Scope

This phase inspected the current v1 codebase and produced the target architecture, migration strategy, phased implementation plan, assumptions, and risks.

Phase 0 deliberately does not replace the Express app yet. The next phase should create the Next.js + TypeScript + Supabase foundation.

## Current v1 Inventory

### Current Working Pieces Worth Keeping Conceptually

- The product idea: one composer that targets LinkedIn, Facebook, and Instagram.
- The rough user flow: write text, attach media, submit.
- The platform distinction: LinkedIn, Facebook, and Instagram need different provider calls.
- The need for an intermediate media host before some platform publishes.
- The static brand assets in `public/images/` can be reused temporarily if they fit the v2 direction.
- The root `PROJECT_CONTEXT.md` should remain the living context document and be updated every iteration.

### Current Pieces To Retire

- Express/EJS runtime as the production architecture.
- Direct browser/form-to-Express `/post` workflow for publishing.
- Google Drive public URLs as the media backbone.
- Direct, fire-and-forget posting inside a single request.
- Hardcoded provider account IDs and LinkedIn URNs.
- Long-lived global platform tokens in `.env` as the account model.
- The nested `instagram-api-int` app.
- Standalone `index.html`, root `style.css`, and `test.html` as product surfaces.
- `uploads/` as durable media storage.
- `axios`; v2 must use `fetch` only.

### Current Pieces To Migrate

- Composer intent should migrate into a Next.js feature module.
- Provider-specific posting knowledge should migrate into server-only publishing providers.
- Media type detection should migrate into shared Zod schemas plus a server-side metadata extraction/preparation pipeline.
- Existing documented risks in `PROJECT_CONTEXT.md` should become tracked cleanup items.
- The product copy can inspire early empty states, but the v2 UI should be redesigned from first principles.

## Current Security Issues

- Provider tokens are process-wide environment variables, not per-user encrypted connection credentials.
- Publishing happens synchronously in one public form POST endpoint.
- There is no authentication or user isolation.
- There is no ownership model for posts, media, connections, jobs, or logs.
- Uploaded files are written to local disk and not cleaned up.
- Google Drive files are made public with `anyone` reader permissions.
- Raw provider errors can be returned to the browser.
- Hardcoded LinkedIn and Facebook account identifiers create unsafe cross-account assumptions.
- `postToInstagram` references `res` outside its scope, causing unsafe secondary failures.
- Unsupported media types can flow into provider publishing attempts.
- No RLS, audit trail, rate limiting, structured logs, idempotency, or retry model exists.

## Hardcoded Values To Remove

- LinkedIn author/owner URN: `urn:li:person:9DxIdmZZ0b`
- Facebook page/object ID: `341549492371560`
- Graph API version in URLs: `v16.0`
- Google Drive as required media host
- Local upload destination: `uploads/`
- Main app port assumption: `3000`
- Nested Instagram app port assumption: `4000`

## Dead Code And Dependency Issues

### Dead Or Prototype Files

- `instagram-api-int/`: Duplicate Instagram-only experiment, not imported by the main app.
- `index.html`: Static prototype, not served by Express root.
- `style.css`: Static prototype stylesheet.
- `test.html`: CKEditor experiment, not wired into product.
- `uploads/`: Runtime artifacts, not source.

### Unused Or To-Be-Retired Dependencies

- `axios`: Used in v1, forbidden in v2.
- `body-parser`: Not needed in Next.js route handlers/server actions.
- `ejs`: Retired with Express.
- `express`: Retired with Next.js.
- `express-session`: Installed but unused.
- `googleapis`: Retired unless a future provider requires it; Supabase Storage should replace Drive.
- `multer`: Retired with local uploads.
- `passport`, `passport-facebook`, `passport-instagram`, `passport-linkedin-oauth2`: Installed but unused; Supabase Auth and provider OAuth flows should replace this model.
- `request`: Deprecated and unused.
- `nodemon`: Retired once Next.js owns the dev server.

## Integration Risks

- LinkedIn, Facebook, and Instagram APIs change over time. Provider adapters must be isolated and version-aware.
- Instagram media publishing has strict requirements and separate image/video flows.
- Provider tokens expire and require refresh handling.
- Scheduling requires safe job claiming to avoid duplicate publishes.
- Some provider APIs require publicly accessible media URLs. Supabase signed URLs may not be enough for all publish flows; the publishing engine must handle provider-specific upload protocols or temporary public access safely.
- Realtime can become noisy or expensive if subscribed at row-by-row granularity without filters.
- RLS policy mistakes can leak user data or block legitimate job processing.
- Streak logic can become confusing if business rules are not explicit from the start.

## Target Architecture Summary

### Runtime Shape

Use one Next.js app as the primary application boundary:

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query.
- Backend: Next.js route handlers/server actions for user-facing secure operations, plus Supabase Edge Functions or server-only job runners for scheduled publishing.
- Data backbone: Supabase Auth, Postgres, Storage, Realtime, RLS.
- Provider publishing: server-only TypeScript modules using `fetch`.
- Validation: Zod at every input boundary.

### Root Command

The v2 target should have one root command for local development:

```bash
npm run dev
```

In Phase 1, this should boot the Next.js app, including frontend and backend route handlers. If a local scheduler/worker becomes necessary before Supabase Edge Functions are wired, use a single root command such as `npm run dev:all` to run Next.js plus the worker together.

### Trust Boundaries

- Browser: untrusted. May hold Supabase anon key and user session only.
- Next.js server route handlers/actions: trusted for validation, ownership checks, and orchestration.
- Supabase Postgres/RLS: final data isolation layer.
- Supabase Storage: private media storage with RLS-backed bucket policies.
- Publishing engine: trusted server-only code. Owns provider tokens, job execution, retries, and normalized errors.
- Provider APIs: external untrusted dependencies. Responses must be normalized before storage/display.

### Data Access Principles

- Client reads user-owned data through Supabase with RLS and explicit `user_id` filters.
- Client writes drafts and safe user-owned rows only when RLS policies allow it.
- Sensitive writes, job creation, provider token handling, and publishing run through server-only code.
- Service role usage is allowed only in server-only contexts and should be narrowly scoped.
- Provider secrets/tokens never reach the browser.

## Proposed Folder Structure For Phase 1+

```text
app/
|-- (auth)/
|-- (app)/
|   |-- dashboard/
|   |-- compose/
|   |-- schedule/
|   |-- connections/
|   `-- analytics/
|-- api/
|   |-- posts/
|   |-- media/
|   |-- connections/
|   `-- publish/
components/
|-- ui/
|-- layout/
|-- empty-states/
features/
|-- dashboard/
|-- composer/
|-- connections/
|-- media/
|-- publishing/
|-- schedule/
|-- streaks/
|-- activity/
|-- analytics/
hooks/
lib/
|-- env/
|-- errors/
|-- fetch/
|-- supabase/
|-- realtime/
schemas/
server/
|-- auth/
|-- media/
|-- publishing/
|   |-- providers/
|   |-- jobs/
|   `-- attempts/
|-- streaks/
|-- analytics/
stores/
supabase/
|-- migrations/
|-- functions/
types/
docs/
```

## What Lives Where

### Frontend

- UI shell, dashboard, composer, schedule views, analytics scaffolding.
- Zustand stores for composer UI, selected platforms, upload progress, draft session state, filters, and transient interactions.
- TanStack Query hooks for server state: profile, connections, posts, jobs, events, streaks, dashboard summaries.
- Realtime subscriptions filtered by authenticated user and focused on activity/events/status changes.
- Client-side Zod validation for forms and media preflight warnings.

### Next.js Server Handlers / Server Actions

- Authenticated mutation endpoints.
- Input validation and sanitization.
- Ownership checks that complement RLS.
- Media upload orchestration and metadata persistence.
- Publish job creation.
- Retry/cancel requests.
- Error normalization before UI responses.

### Supabase

- Auth and user identity.
- Postgres tables, enums, foreign keys, indexes, RLS policies.
- Storage bucket for original media and prepared media variants.
- Realtime for activity events, post target statuses, streak state, and dashboard summaries.
- Edge Functions for scheduled job execution if the deployment model supports it cleanly.

### Publishing Engine

- Server-only provider adapters for LinkedIn, Facebook, Instagram.
- Job claiming and state transitions.
- Per-platform payload preparation.
- Attempt tracking, retry scheduling, and normalized errors.
- Activity event emission.
- Streak update trigger after successful publish completion.

## Initial Data Model Direction

Phase 2 should implement at least:

- `profiles`: app-level user profile tied to `auth.users`.
- `social_connections`: one row per connected provider/account.
- `media_assets`: original uploads and metadata.
- `media_variants`: optional prepared provider-specific versions.
- `posts`: canonical creator post/draft/scheduled unit.
- `post_platform_targets`: per-platform target state, settings, warnings, and provider result IDs.
- `publish_jobs`: executable work items for now/scheduled publishing.
- `publish_attempts`: every provider attempt with normalized outcome.
- `activity_events`: realtime feed and audit surface.
- `streak_state`: current streak, last counted publish date, timezone.
- `streak_events`: optional history for explainability.
- `analytics_daily_rollups`: optional derived scaffold for dashboard summaries.

## Media Engine Direction

Media handling must not assume one universal image shape.

### Store Metadata

For each uploaded media asset, store:

- owner/user ID
- storage bucket/path
- original filename
- MIME type
- byte size
- media kind: image or video
- width and height when available
- duration for video when available
- aspect ratio
- checksum/hash if practical
- validation warnings
- created timestamps

### Platform Guidance Rules

Use the requested 2026 constraints as validation targets:

- LinkedIn shared image/link: `1200 x 627` at `1.91:1`
- LinkedIn video: `1920 x 1080` at `16:9` or `1080 x 1350` at `4:5`
- Facebook image: `1080 x 1350` or `1080 x 1080`
- Instagram square: `1080 x 1080`
- Instagram portrait: `1080 x 1350`
- Instagram landscape: `1080 x 566`

Phase 5 should implement validation and warnings first. Automatic transformation can be scaffolded as a future-safe pipeline and should only become live once transparent previews and provider-safe outputs exist.

## Publishing Engine Direction

The v2 engine should model publishing as stateful jobs, not a synchronous button handler.

Recommended state flow:

```text
post draft -> scheduled/ready -> publish_job queued -> claimed -> publishing
target pending -> publishing -> succeeded | failed | retry_scheduled | canceled
job queued -> running -> succeeded | partially_failed | failed | canceled
```

Principles:

- One publish job may cover one post and many platform targets.
- Attempts are per platform target.
- One provider failure must not block other provider targets.
- Idempotency keys should be generated for jobs/targets where provider support or internal retry safety needs it.
- Retry logic should be deterministic and capped.
- Provider errors should be normalized and raw details kept server-side only.
- Activity events should be emitted on state transitions.
- Streak updates should happen after business-rule-qualified success.

## Streak System Direction

Proposed initial business rules:

- A posting day is based on the user's profile timezone.
- A post counts once per calendar day when at least one selected platform target succeeds.
- A multi-platform publish counts as one successful creator action, not three separate streak credits.
- Draft creation does not count.
- Scheduled posts count when they successfully publish, not when they are scheduled.
- Manual retries count only if they cause a successful publish on a day that has not already been counted.

These rules should be made visible in code comments and dashboard copy where needed.

## Realtime Direction

Use Supabase Realtime selectively:

- Subscribe to `activity_events` for the recent feed.
- Subscribe to `post_platform_targets` or a compact status view for active/scheduled posts.
- Subscribe to `streak_state` for streak card updates.
- Avoid broad table subscriptions without user filters.
- Prefer inserting normalized events over making the client infer meaning from many low-level updates.

## Migration Strategy

1. Keep v1 untouched while Phase 1 creates the Next.js foundation.
2. Add v2 files in place at the repo root and retire Express scripts once Next.js boots cleanly.
3. Preserve `PROJECT_CONTEXT.md` and this Phase 0 document as migration references.
4. Move useful image assets into the new `public/` convention if needed.
5. Replace local uploads and Google Drive with Supabase Storage.
6. Replace global tokens with `social_connections` records and server-only encrypted token handling.
7. Replace `/post` with a job-backed publish API.
8. Delete retired v1 files only after v2 has equivalent or better behavior documented and tested.

## Phased Implementation Plan

### Phase 1: Foundation And Project Setup

- Initialize Next.js App Router with TypeScript and Tailwind.
- Install and configure shadcn/ui via the shadcn MCP workflow.
- Add Zustand, TanStack Query, Supabase clients, Zod, strict TypeScript, linting, env validation, and fetch utilities.
- Add auth scaffolding, UI shell, empty/loading/error states, and design baseline.
- Verify `npm run dev`, typecheck, and lint.

### Phase 2: Database Design And Supabase Schema

- Create Supabase migrations for tables, enums, indexes, foreign keys, and RLS.
- Add storage bucket and policies.
- Add typed database helpers and schema docs.
- Test ownership CRUD and policy boundaries.

### Phase 3: Auth And User Account System

- Implement sign up, sign in, sign out, protected layouts, profile bootstrap, and server/client session boundaries.
- Test authenticated and unauthenticated flows.

### Phase 4: Dashboard Shell And Real-Time Home

- Build dashboard cards, activity feed, scheduled summary, platform summary, and quick compose CTA.
- Add realtime subscriptions for meaningful updates.

### Phase 5: Post Composer v2

- Build composer, platform selector, media upload, preview, validation warnings, draft save, and post now/schedule controls.
- Store media metadata and prepare publishing data.

### Phase 6: Social Connection Architecture

- Build secure connection records and provider-specific scaffolding.
- Mark OAuth live vs pending honestly.

### Phase 7: Publishing Engine v2

- Implement job/attempt state machine, provider adapters, retries, normalized errors, activity logs, and status propagation.

### Phase 8: Scheduling System

- Add future scheduling, safe job claiming, cancellation, duplicate guards, and timezone-aware execution.

### Phase 9: Streak System

- Implement streak rules, persistence, realtime updates, and dashboard UX.

### Phase 10: Real-Time Activity System

- Expand event coverage and tune subscriptions.

### Phase 11: Basic Analytics Scaffolding

- Add summaries for total posts, platform distribution, weekly posts, streak history, success/failure rate, and scheduled vs instant posts.

### Phase 12: QA, Hardening, And Cleanup

- Remove v1 dead code, verify no axios remains, harden RLS/security, improve comments, document setup, and polish UX/accessibility/mobile behavior.

## Assumptions

- Supabase will be the primary backend for auth, database, storage, realtime, and scheduled/edge execution where practical.
- The app will support individual creators first, not teams/workspaces in the first pass.
- Full provider OAuth may require app credentials and review flows that are not available locally yet.
- Provider publish APIs will be integrated behind server-only adapters and may start scaffolded until credentials are ready.
- The first production-minded scheduler can be implemented through Supabase Edge Functions or a server-only worker, depending on deployment constraints.
- The user wants v2 to replace v1 rather than coexist as a long-term dual app.

## Risks

- Provider OAuth and publish permissions can be slow to obtain and vary by app/account type.
- Token encryption needs a deliberate implementation; storing plaintext tokens in Postgres is not acceptable.
- Supabase Edge Functions and Next.js route handlers have different runtime constraints; provider adapter code should avoid Node-only assumptions if it may move to Edge.
- Media dimension extraction in the browser is convenient but not authoritative; server-side metadata validation is still needed.
- Scheduled publishing requires locking/idempotency to avoid duplicate posts.
- RLS testing is essential; policy mistakes are easy to miss by manual UI testing.
- Realtime UX can become noisy if every low-level status change is surfaced directly.

## Phase 0 Test And Verification

Commands run:

```bash
Get-ChildItem -Force
rg --files --glob '!node_modules/**' --glob '!instagram-api-int/node_modules/**'
git status --short
Get-Content -Raw package.json
Get-Content -Raw app.js
Get-Content -Raw views\index.ejs
Get-Content -Raw instagram-api-int\index.js
Get-Content -Raw PROJECT_CONTEXT.md
```

Result:

- Repository structure and v1 implementation were inspected.
- No runtime code was changed.
- No automated tests exist in v1, so Phase 0 validation is documentation and discovery only.

## What Remains After Phase 0

- Phase 1 must create the Next.js + TypeScript foundation.
- Phase 2 must implement the Supabase schema and RLS policies.
- v1 code is still present and should be retired only after equivalent v2 foundations exist.
- No production-ready v2 runtime exists yet.
