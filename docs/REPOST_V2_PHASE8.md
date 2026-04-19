# RE-post v2 Phase 8 - Scheduling System

Date: 2026-04-19

## Goal

Make scheduling a real system instead of a timestamp field. Scheduled publishing must be timezone-aware, cancelable before worker claim, safe to reprocess, and ready for Supabase Cron or another hosted scheduler.

## What Was Implemented

- Added timezone-aware scheduled time parsing in `server/scheduling/time.ts`.
- Updated composer server action to convert creator wall-clock time plus IANA timezone into UTC before saving.
- Added future-time validation so scheduled posts must be at least one minute ahead.
- Added a Phase 8 migration with `public.cancel_scheduled_post(post_id_input uuid)`.
- Added cancellation server action in `server/scheduling/actions.ts`.
- Added scheduled queue data to the dashboard summary.
- Added dashboard scheduled queue UI with cancel controls.
- Added `supabase/functions/publish-worker/index.ts` as the Supabase Cron target scaffold.
- Navigation expansion Phase 8 later deployed this Edge Function through Supabase MCP with `verify_jwt=true`.
- Navigation expansion Phase 8 added `public.invoke_publish_worker_cron(...)`, Vault-backed cron invocation, and `supabase/sql/repost_publish_worker_cron.sql`.
- Updated the publishing engine to skip/cancel jobs whose post is no longer publishable.
- Added scheduler-specific indexes for upcoming scheduled posts and worker recovery.
- Added `PUBLISH_WORKER_URL` to env validation/template for the Edge Function forwarding path.
- Updated `/api/health` to report `phase: 8`.

## Scheduling Flow

1. The browser sends a `datetime-local` value and the creator's IANA timezone.
2. The server converts that wall-clock time into UTC.
3. The post is saved as `scheduled`.
4. A `publish_jobs` row is created with `run_at` set to the UTC scheduled time.
5. A cron runner invokes the worker endpoint periodically.
6. `claim_publish_jobs` only claims jobs where `run_at <= now()`.
7. The Phase 7 engine handles provider execution, attempts, retries, and status propagation.

## Cancellation Flow

Scheduled posts can be canceled while they are still unclaimed.

`public.cancel_scheduled_post(...)` updates:

- `posts.status` to `canceled`
- matching queued/failed `publish_jobs` to `canceled`
- pending/queued/retry targets to `canceled`
- `activity_events` with a cancellation audit entry

It returns `false` if the post is already claimed, running, succeeded, missing, or not owned by the authenticated creator.

## Cron Strategy

The recommended hosted path is:

1. Deploy `supabase/functions/publish-worker` with JWT verification enabled.
2. Set Edge Function secrets:
   - `PUBLISH_WORKER_URL`
   - `PUBLISH_WORKER_SECRET`
3. Store cron invocation values in Supabase Vault:
   - `repost_publish_worker_function_url`
   - `repost_publish_worker_function_jwt`
4. Use Supabase Cron plus `pg_net` to invoke the Edge Function every minute.

The current runbook lives at:

```text
supabase/sql/repost_publish_worker_cron.sql
```

Core cron command after functions/secrets are deployed:

```sql
select cron.schedule(
  'repost-publish-worker-every-minute',
  '* * * * *',
  $$ select public.invoke_publish_worker_cron(10); $$
);
```

The app also keeps `POST /api/publish/run` available for manual or external scheduler invocation.

## MCP Status

The Codex MCP server setup was completed:

```bash
codex mcp add supabase --url https://mcp.supabase.com/mcp?project_ref=ekrvyrpuxipaqnojbxyt
codex mcp login supabase
codex mcp list
```

`codex mcp list` reports Supabase as enabled with OAuth auth.

MCP is now available in this agent session. The cron deployment migration was applied remotely and the Edge Function was deployed through MCP during navigation expansion Phase 8.

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
```

## Production-Ready vs Scaffolded

Production-minded foundation:

- timezone-aware UTC conversion
- database-backed cancellation function
- dashboard queue visibility
- worker-safe publishability guard
- scheduler/worker execution path
- locking remains in Postgres via Phase 7 job claim RPC

Scaffolded:

- recurring Supabase Cron job installation after production secrets are set
- live cancellation verification against the hosted database
- provider-specific publishing calls

## What Remains

Phase 9 should build the streak system:

- formal business rules
- successful publish event handling
- daily boundary logic by creator timezone
- streak state updates
- realtime streak activity
- missed-day and recovery UX states
