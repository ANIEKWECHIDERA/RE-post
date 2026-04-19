# RE-post v2 Setup

This document is the practical setup path for the current Next.js + Supabase app.

## Requirements

- Node.js compatible with Next.js 16
- npm
- Supabase project access
- Codex Supabase MCP access or a valid Supabase CLI access token

## Install

```bash
npm install
```

## Environment

Create `.env` from `.env.example`.

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

- `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY`, and `PUBLISH_WORKER_SECRET` must stay server-only.
- `PUBLISH_PROVIDER_MODE=disabled` is the safe default.
- `PUBLISH_PROVIDER_MODE=mock` can test the internal publishing flow without real provider calls.
- `PUBLISH_PROVIDER_MODE=live` enables real provider adapter calls from the server-side worker.
- Live Facebook and Instagram publishing still require Page/professional-account selection and provider app review before real-account use.
- The Supabase `publish-worker` Edge Function also needs `PUBLISH_WORKER_URL` and `PUBLISH_WORKER_SECRET` configured as Edge Function secrets before cron can execute real jobs.

## Run

One command runs the web app and its Next.js backend route handlers:

```bash
npm run dev:all
```

The plain Next.js command remains available:

```bash
npm run dev
```

## Verify

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The Playwright smoke test creates a temporary confirmed Supabase Auth user with `SUPABASE_SERVICE_ROLE_KEY`, signs in through the UI, queues a text post, visits Connections, and deletes the test user afterward.

Health endpoint:

```text
/api/health
```

Expected current phase:

```json
{ "ok": true, "app": "re-post-v2", "phase": 12, "supabaseConfigured": true }
```

## Database Migrations

Remote migrations applied through Supabase MCP:

- `repost_v2_phase2_schema`
- `repost_v2_phase4_realtime`
- `repost_v2_phase6_connection_oauth_states`
- `repost_v2_phase7_publish_claiming`
- `repost_v2_phase8_scheduling`
- `repost_v2_phase9_streak_engine`
- `repost_v2_phase12_hardening`
- `repost_v2_phase6_token_lifecycle`
- `repost_v2_phase8_cron_deployment`

The local `SUPABASE_ACCESS_TOKEN` value is still not accepted by the Supabase CLI as a valid `sbp_...` token, so Supabase MCP is currently the working remote migration path.

## Worker

Manual worker route:

```text
POST /api/publish/run
Authorization: Bearer <PUBLISH_WORKER_SECRET>
```

Supabase Edge Function:

```text
supabase/functions/publish-worker/index.ts
```

The function is deployed as `publish-worker` with JWT verification enabled. It forwards scheduled cron calls to the Next.js worker endpoint.

Cron install runbook:

```text
supabase/sql/repost_publish_worker_cron.sql
```

Before scheduling cron:

1. Deploy the Next.js app so `POST /api/publish/run` is publicly reachable.
2. Set Edge Function secrets:
   - `PUBLISH_WORKER_URL`
   - `PUBLISH_WORKER_SECRET`
3. Add Supabase Vault secrets:
   - `repost_publish_worker_function_url`
   - `repost_publish_worker_function_jwt`
4. Schedule `public.invoke_publish_worker_cron(10)` every minute through the SQL runbook.

## Known Limitations

- LinkedIn text/image adapter code exists, but real-account validation still requires approved credentials and `PUBLISH_PROVIDER_MODE=live`.
- Facebook and Instagram adapter code exists, but Page/professional-account selection is still pending before current connected accounts can publish.
- The cron helper and Edge Function are deployed, but the recurring cron job should not be installed until production app URL, Edge Function secrets, and Vault secrets are configured.
- Provider-native analytics are not live.
- Scheduled rollup analytics are not populated yet.
- Supabase advisor still reports `citext` and `pg_net` installed in `public`; `pg_net` does not support `ALTER EXTENSION ... SET SCHEMA`, so treat it as a known platform warning unless Supabase provides a supported move path.
- Supabase Auth leaked password protection is disabled; enable it before production.
- Playwright user-flow coverage is a smoke test only; broader media upload, scheduling, realtime multi-tab, and provider OAuth flows still need dedicated tests.
