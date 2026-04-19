# RE-post v2 Navigation Expansion Phase 8 - Cron Deployment

Date: 2026-04-19

## Goal

Make scheduled publishing deployment-ready with a browser-free cron path that
uses Supabase Cron, `pg_net`, Vault, and a JWT-protected Edge Function.

## What Was Implemented

- Added `supabase/migrations/202604190009_repost_v2_phase8_cron_deployment.sql`.
- Applied the migration remotely through Supabase MCP as
  `repost_v2_phase8_cron_deployment`.
- Enabled `pg_net` and `pg_cron` on the remote Supabase project.
- Added `public.invoke_publish_worker_cron(limit_input integer default 10)`.
- Revoked public, anon, and authenticated execution on the cron helper.
- Added database type support for `invoke_publish_worker_cron`.
- Deployed the `publish-worker` Supabase Edge Function through MCP.
- Deployed the function with `verify_jwt=true`.
- Added `supabase/sql/repost_publish_worker_cron.sql` as the private install
  runbook for Vault secrets and the recurring cron job.
- Updated the Edge Function source comment to document the JWT-protected cron
  boundary.

## Runtime Architecture

The production flow is:

1. Supabase Cron runs every minute.
2. Cron calls `public.invoke_publish_worker_cron(10)`.
3. The helper reads the Edge Function URL and JWT from Supabase Vault.
4. The helper invokes the JWT-protected `publish-worker` Edge Function through
   `pg_net`.
5. The Edge Function forwards to the Next.js worker endpoint:
   `POST /api/publish/run`.
6. The Next.js worker uses the service-role publishing engine to claim due jobs
   with row locks and process them.

This keeps scheduled publishing server-side all the way down. The browser never
executes or authorizes scheduled jobs.

## Required Production Secrets

Edge Function secrets:

```text
PUBLISH_WORKER_URL=https://<your-next-app-domain>/api/publish/run
PUBLISH_WORKER_SECRET=<same secret configured in the Next.js app>
```

Supabase Vault secrets:

```text
repost_publish_worker_function_url=https://<project-ref>.supabase.co/functions/v1/publish-worker
repost_publish_worker_function_jwt=<Supabase anon or publishable key>
```

The Vault secrets are used only by Postgres cron to call the JWT-protected Edge
Function. The Edge Function secrets are used only by the Edge Function to call
the Next.js worker.

## Cron Installation

After the Next.js app is deployed and Edge Function secrets are set, run the
private SQL runbook:

```text
supabase/sql/repost_publish_worker_cron.sql
```

The migration intentionally does not auto-create the recurring cron job. Without
real production URLs/secrets, an auto-created job would fail every minute and
pollute cron history.

## Observability

Inspect cron runs:

```sql
select *
from cron.job_run_details
where jobid = (
  select jobid
  from cron.job
  where jobname = 'repost-publish-worker-every-minute'
)
order by start_time desc
limit 10;
```

Inspect HTTP responses from `pg_net`:

```sql
select *
from net._http_response
order by created desc
limit 10;
```

The Next.js worker response includes the worker id, claimed jobs, processed
jobs, successes, failures, and retry count.

## Security Notes

- Cron secrets live in Supabase Vault, not in migration files.
- The Edge Function requires a valid JWT.
- The Next.js worker still requires `PUBLISH_WORKER_SECRET`.
- The database helper is `security definer` but is not executable by public,
  anon, or authenticated roles.
- Job dedupe remains in `claim_publish_jobs` through row locks and lock expiry.

## References Used

- Supabase Scheduling Edge Functions:
  `https://supabase.com/docs/guides/functions/schedule-functions`
- Supabase Cron:
  `https://supabase.com/docs/guides/cron`
- Supabase `pg_net`:
  `https://supabase.com/docs/guides/database/extensions/pg_net`
- Supabase Vault:
  `https://supabase.com/docs/guides/database/vault`

## Tests

Passed locally:

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

Remote verification through MCP:

- migration `repost_v2_phase8_cron_deployment` is listed
- `publish-worker` Edge Function is active at version 2
- `publish-worker` has `verify_jwt=true`
- `pg_net` and `pg_cron` are installed

Supabase advisor notes after this phase:

- Security advisor reports `extension_in_public` for existing `citext`.
- Security advisor reports `extension_in_public` for newly enabled `pg_net`.
  I tested `alter extension pg_net set schema extensions`, but Postgres reports
  that `pg_net` does not support `SET SCHEMA`. Keep this as a known platform
  warning unless a future Supabase-supported migration path is available.
- Security advisor reports leaked password protection is disabled in Auth.
- Performance advisor reports unused indexes, expected while the project has
  little real workload.
