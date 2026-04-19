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
- Real provider publishing still needs OAuth callback/token exchange.

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

The local `SUPABASE_ACCESS_TOKEN` value is still not accepted by the Supabase CLI as a valid `sbp_...` token, so Supabase MCP is currently the working remote migration path.

## Worker

Manual worker route:

```text
POST /api/publish/run
Authorization: Bearer <PUBLISH_WORKER_SECRET>
```

Optional Supabase Edge Function scaffold:

```text
supabase/functions/publish-worker/index.ts
```

The function forwards scheduled cron calls to the Next.js worker endpoint.

## Known Limitations

- Real LinkedIn, Facebook, and Instagram publishing is not live until OAuth callback/token exchange is implemented.
- Provider-native analytics are not live.
- Scheduled rollup analytics are not populated yet.
- Supabase advisor still reports `citext` installed in `public`; moving it requires a careful compatibility migration.
- Playwright user-flow coverage is a smoke test only; broader media upload, scheduling, realtime multi-tab, and provider OAuth flows still need dedicated tests.
