# RE-post v2 Phase 7 - Publishing Engine

Date: 2026-04-19

## Goal

Build the first backend-controlled publishing pipeline for RE-post v2. The browser must only create posts, targets, media records, and jobs. Publishing execution, provider payload preparation, token access, attempts, retries, and status propagation must happen server-side.

## What Was Implemented

- Added a service-role Supabase admin boundary in `lib/supabase/admin.ts`.
- Added `public.claim_publish_jobs(...)` migration with row locking and `FOR UPDATE SKIP LOCKED`.
- Added typed support for the `claim_publish_jobs` RPC in `types/database.ts`.
- Added `server/publishing/engine.ts` to:
  - claim due publish jobs
  - mark jobs as running
  - process each platform target independently
  - create `publish_attempts`
  - update target, post, and job statuses
  - record activity events
  - preserve retryable failures as future queued work
- Added provider adapter boundary in `server/publishing/provider-adapters.ts`.
- Added normalized provider errors in `server/publishing/errors.ts`.
- Added protected worker endpoint at `POST /api/publish/run`.
- Added `PUBLISH_WORKER_SECRET` and `PUBLISH_PROVIDER_MODE` env validation.
- Generated a local ignored `PUBLISH_WORKER_SECRET` in `.env`.
- Updated the composer success message to reflect that the worker route now exists.
- Updated `/api/health` to report `phase: 7`.
- Extended schema verification to check the Phase 7 publish claiming migration.

## Worker Endpoint

Route:

```text
POST /api/publish/run
```

Authorization:

```text
Authorization: Bearer <PUBLISH_WORKER_SECRET>
```

or:

```text
x-publish-worker-secret: <PUBLISH_WORKER_SECRET>
```

Body:

```json
{
  "limit": 5
}
```

`limit` is optional and is capped at 25.

This route is intended for a cron runner, a small background worker, or a future Supabase Edge Function. It is intentionally not called by the browser UI.

## Provider Adapter State

This original phase created the adapter boundary. Navigation expansion Phase 7
later added real provider adapter modules behind `PUBLISH_PROVIDER_MODE=live`.

Current modes:

- `PUBLISH_PROVIDER_MODE=disabled`: default; jobs fail safely with `provider_adapter_disabled`.
- `PUBLISH_PROVIDER_MODE=mock`: records successful mock provider IDs for end-to-end engine flow testing.
- `PUBLISH_PROVIDER_MODE=live`: invokes the real server-side provider adapters.

Live mode should only be used with approved provider apps and controlled
test accounts. Facebook still needs Page-token selection, and Instagram still
needs Meta-backed professional-account selection before current connected
records can publish successfully.

## Retry Model

- Jobs are claimed with a lock window to avoid duplicate processing.
- Each target gets an independent publish attempt.
- One platform failure does not prevent other targets from running.
- Retryable provider errors return the target to `retry_scheduled` and keep the job `queued` with a future `run_at`.
- Terminal provider failures mark only the relevant target failed.

## Security Notes

- The publishing engine uses the Supabase service role only in server-only modules.
- Provider tokens are never exposed to client code.
- The worker endpoint uses a timing-safe secret comparison.
- Raw provider errors are normalized before being persisted or returned.
- The worker route returns generic failures and relies on server logs for operational detail.

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
npm audit --audit-level=high
```

Build output confirms the worker route is registered:

```text
/api/publish/run
```

## Supabase Push Status

Migrations were not applied remotely in this phase.

The `claude` CLI is not installed in this shell, so the Claude MCP setup command could not be used here.

The Supabase CLI still rejects the current `SUPABASE_ACCESS_TOKEN` value:

```text
Invalid access token format. Must be like `sbp_0102...1920`.
```

Once a valid Supabase personal access token is present, run:

```bash
npx supabase link --project-ref ekrvyrpuxipaqnojbxyt
npx supabase db push
```

## Production-Ready vs Scaffolded

Production-minded foundation:

- job claiming and locking
- service-role server boundary
- worker route authorization
- per-target attempts
- retry-safe status propagation
- normalized error persistence

Live adapter modules now exist:

- LinkedIn text/image publishing
- Facebook Page text/image publishing once a Page token exists
- Instagram professional-account image publishing once an IG Graph account token exists

Still scaffolded:

- Facebook Page selection
- Instagram professional-account selection
- provider video/carousel flows
- controlled real-account validation
- cron/hosted scheduler invocation

## What Remains

Phase 8 should focus on scheduling:

- cron or scheduler strategy
- cancellation behavior
- duplicate publish guards
- timezone-aware scheduled execution
- operational worker documentation
- live Supabase verification after migrations are pushed
