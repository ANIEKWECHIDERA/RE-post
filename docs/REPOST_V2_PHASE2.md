# RE-post v2 Phase 2: Supabase Schema, RLS, And Storage

Last updated: 2026-04-18

Phase status: complete as schema implementation. Database execution is pending a local or hosted Supabase project.

## What Is Live In Source

Phase 2 adds the Supabase data model and security policy foundation for RE-post v2:

- Supabase config at `supabase/config.toml`
- Main migration at `supabase/migrations/202604180001_repost_v2_phase2_schema.sql`
- Ownership smoke test SQL at `supabase/tests/phase2_rls_smoke.sql`
- Manual `Database` TypeScript type surface in `types/database.ts`
- Supabase client factories now use the `Database` type
- Schema coverage verifier at `scripts/verify-phase2-schema.mjs`
- Root script: `npm run verify:schema`
- Health endpoint now reports `phase: 2`

## Schema Overview

### Enums

The migration defines enums for:

- `social_platform`
- `social_connection_status`
- `media_kind`
- `media_asset_status`
- `post_status`
- `schedule_mode`
- `post_target_status`
- `publish_job_status`
- `publish_attempt_status`
- `activity_event_type`
- `streak_event_type`

### Tables

Core user and account tables:

- `profiles`
- `social_connections`

Media tables:

- `media_assets`
- `media_variants`

Post and targeting tables:

- `posts`
- `post_media_assets`
- `post_platform_targets`

Publishing engine tables:

- `publish_jobs`
- `publish_attempts`

Realtime/activity/streak/analytics tables:

- `activity_events`
- `streak_state`
- `streak_events`
- `analytics_daily_rollups`

## Key Design Decisions

### User Ownership Everywhere

Every user-owned table includes either:

- `user_id uuid references auth.users(id)`, or
- a primary `user_id`/`id` tied directly to `auth.users`.

RLS policies use `(select auth.uid()) = user_id` or `(select auth.uid()) = id` for owner isolation.

### Profile Bootstrap

The migration adds `public.handle_new_user()` and an `on_auth_user_created` trigger.

On signup, it creates:

- `profiles`
- `streak_state`
- an initial `activity_events` row

This keeps Phase 3 auth onboarding simple and consistent.

### Third-Party Tokens

`social_connections` includes `access_token_ciphertext` and `refresh_token_ciphertext`, but no plaintext token columns.

Phase 6 must implement encryption/decryption in server-only code. The browser should never receive provider credentials.

### Media Metadata And Variants

`media_assets` stores original upload metadata:

- bucket/path
- MIME type
- byte size
- image/video kind
- dimensions
- duration
- aspect ratio
- checksum
- validation warnings

`media_variants` is ready for future platform-specific prepared media. Phase 5 will add upload/metadata extraction; automatic transformation remains future-safe scaffolding.

### Publishing Jobs And Attempts

The publishing engine is modeled around durable jobs:

- `publish_jobs`: scheduled or immediate work item
- `publish_attempts`: per-platform attempt records
- `post_platform_targets`: per-platform status/result/error surface

This avoids the v1 "fire every provider in one request" model.

### Activity Events

`activity_events` is the future Supabase Realtime feed source. The client should subscribe to this table with user filters instead of inferring activity from many noisy low-level table changes.

### Streaks

`streak_state` stores current streak state.

`streak_events` stores explainable history such as incremented, missed, recovered, or reset.

Phase 9 will implement the business logic.

### Analytics Scaffold

`analytics_daily_rollups` gives the app a lean rollup table for dashboard and analytics views without building a full analytics suite too early.

## RLS Policies

RLS is enabled on every public table created by the migration.

Policy pattern:

- authenticated users can select their own rows
- authenticated users can insert rows only with their own `user_id`
- authenticated users can update/delete rows only when they own them
- join tables add extra checks to verify referenced rows are also owned by the same user

Tables covered:

- `profiles`
- `social_connections`
- `media_assets`
- `media_variants`
- `posts`
- `post_media_assets`
- `post_platform_targets`
- `publish_jobs`
- `publish_attempts`
- `activity_events`
- `streak_state`
- `streak_events`
- `analytics_daily_rollups`

Service-role server code can still bypass RLS when needed for jobs, but that must remain server-only and narrowly scoped.

## Storage Policies

The migration creates a private Supabase Storage bucket:

```text
post-media
```

Bucket settings:

- not public
- file size limit: 100 MB
- allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `video/mp4`
  - `video/quicktime`
  - `video/webm`

Storage object policies require the first path segment to match the authenticated user ID:

```text
{user_id}/...
```

This prevents insecure direct object access across users.

## Indexes

Indexes were added around expected access paths:

- user + status lookups
- scheduled post and due job lookups
- activity feed by user and created date
- streak history by user/date
- analytics rollups by user/date
- provider connection lookup by user/platform/status

## TypeScript Types

`types/database.ts` now mirrors the migration enough for typed Supabase clients.

This is a manual type surface for Phase 2. Once a real Supabase project is connected, prefer generated types from Supabase CLI and compare them against this file before replacing it.

## Testing And Verification

Commands run:

```bash
npm run verify:schema
npm run check
npm run build
npm audit
npx supabase --version
docker --version
```

Results:

- `npm run verify:schema`: passed
- `npm run check`: passed
- `npm run build`: passed
- `npm audit`: zero vulnerabilities
- `npx supabase --version`: `2.92.1`
- `docker --version`: failed because Docker is not installed

The app still boots and builds after Phase 2.

## Verification Gap

The SQL migration has not been applied to a live database in this workspace because Docker is not installed and no hosted Supabase project is linked/configured.

That means executable verification of:

- migration application
- RLS runtime behavior
- storage policy runtime behavior
- ownership CRUD under authenticated roles

is pending until a Supabase environment is available.

To close the gap, run the migration against local or hosted Supabase, then run:

```sql
\i supabase/tests/phase2_rls_smoke.sql
```

or paste the file into the Supabase SQL editor after applying the migration.

## Production-Ready vs Scaffolded

Production-minded foundation:

- normalized table design
- RLS enabled for every public table
- private storage bucket rules
- owner-isolated policies
- typed database contract
- trigger-based profile/streak bootstrap
- publishing job/attempt tables
- activity event feed source

Still scaffolded:

- migration has not been applied in this workspace
- token encryption implementation is pending Phase 6
- media upload/metadata extraction is pending Phase 5
- publishing execution is pending Phase 7
- scheduling job claiming is pending Phase 8
- streak calculation logic is pending Phase 9
- analytics rollup generation is pending Phase 11

## What Remains

Phase 3 should implement Supabase Auth in the app:

- sign up
- sign in
- sign out
- protected routes
- profile bootstrap validation
- authenticated data loading
- session-safe redirects
- user isolation checks against the Phase 2 schema
