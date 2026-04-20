# RE-post v2

RE-post v2 is a creator-first social media management app for planning,
optimizing, scheduling, publishing, and tracking posts across LinkedIn,
Facebook, and Instagram.

The product direction is closer to "Strava for creators" than a generic admin
dashboard: consistency, streaks, realtime activity, clean dashboards, and a
backend-controlled publishing engine are the core of the experience.

## Current Status

This repository contains the active v2 rebuild. The old Express/EJS prototype
has been retired from the active app path.

Implemented foundations include:

- public marketing landing page at `/`
- Supabase Auth with protected app routes
- creator dashboard with realtime activity patterns
- post composer with platform selection, media upload, validation, and warnings
- drafts page and draft lifecycle
- scheduled posts page with reschedule/cancel/delete/duplicate flows
- analytics page using internal publishing data
- encrypted provider token storage
- OAuth callback architecture for LinkedIn, Facebook, and Instagram
- backend publishing jobs, attempts, retries, and normalized provider errors
- LinkedIn/Facebook/Instagram adapter modules behind explicit live mode
- timezone-aware scheduling and cancellation
- streak engine and streak activity
- Supabase Edge Function cron target plus Postgres cron helper
- Playwright app-level E2E coverage for safe non-provider flows

Provider publishing is intentionally gated. LinkedIn text/image adapter code is
implemented, while Facebook and Instagram require Page/professional-account
selection before normal connected accounts can publish. Real provider tests
should run only in a controlled staging setup.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for transient UI state
- TanStack Query for server state
- Zod for validation
- Supabase Auth, Postgres, Storage, Realtime, Edge Functions, and RLS
- native `fetch` only, no axios

## Project Structure

```text
app/          Next.js routes, layouts, and API route handlers
components/   shared UI and layout components
features/     product feature UI, including the public marketing landing page
hooks/        React Query and realtime hooks
lib/          env, fetch, error, and Supabase client helpers
schemas/      Zod schemas
server/       server-only domain logic and worker code
stores/       Zustand stores
supabase/     migrations, Edge Functions, SQL runbooks, tests
tests/        Playwright E2E tests
types/        shared TypeScript types
docs/         phase notes, setup, and architecture context
```

For deep implementation context, start with [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Fill in the Supabase values and server-only secrets in `.env`. Keep real
secrets out of git.

Run the app:

```bash
npm run dev:all
```

The app should be available at:

```text
http://localhost:3000
```

## Environment Variables

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
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=
PUBLISH_WORKER_SECRET=
PUBLISH_WORKER_URL=
PUBLISH_PROVIDER_MODE=disabled
```

Important notes:

- `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY`, and
  `PUBLISH_WORKER_SECRET` are server-only.
- `PUBLISH_PROVIDER_MODE=disabled` is the safe default.
- Use `PUBLISH_PROVIDER_MODE=mock` for internal worker flow testing.
- Use `PUBLISH_PROVIDER_MODE=live` only with approved provider apps and
  controlled test accounts.
- `PUBLISH_WORKER_URL` should point to the deployed app worker route:
  `https://your-domain.com/api/publish/run`.

## Useful Commands

```bash
npm run dev:all
npm run check
npm run build
npm run verify:schema
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

`npm run check` runs TypeScript and ESLint.

`npm run test:e2e` uses Supabase Admin Auth to create temporary test users,
exercise safe app flows, and delete those users afterward. It does not call
LinkedIn, Facebook, or Instagram.

## Deployment

The repository is prepared for Netlify deployment with [netlify.toml](./netlify.toml).

Netlify build settings:

```text
Build command: npm run build
Publish directory: .next
Node version: 22
```

After the first deploy, set `PUBLISH_WORKER_URL` to:

```text
https://your-netlify-domain.netlify.app/api/publish/run
```

Then add the deployed OAuth callback URLs in each provider dashboard and add the
deployed site URL in Supabase Auth settings. See
[docs/NETLIFY_DEPLOYMENT.md](./docs/NETLIFY_DEPLOYMENT.md).

Public legal pages for provider review:

```text
/privacy
/terms
/data-deletion
```

## Supabase

The app uses Supabase for:

- authentication
- Postgres data storage
- row-level security
- private media storage
- realtime updates
- Edge Functions for scheduled worker forwarding
- Vault-backed cron invocation

Remote migrations have been applied through Supabase MCP in the active project.
Local migration files live in [supabase/migrations](./supabase/migrations).

The scheduled publishing cron path is:

```text
Supabase Cron
  -> public.invoke_publish_worker_cron(10)
  -> pg_net
  -> JWT-protected Supabase Edge Function publish-worker
  -> Next.js POST /api/publish/run
  -> server-side publishing engine
```

The recurring cron job should only be installed after production URLs and
secrets are configured. See [docs/SETUP.md](./docs/SETUP.md) and
[supabase/sql/repost_publish_worker_cron.sql](./supabase/sql/repost_publish_worker_cron.sql).

## Provider Integrations

Provider secrets needed for full real-account validation:

```text
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
```

OAuth callback routes:

```text
/api/connections/linkedin/callback
/api/connections/facebook/callback
/api/connections/instagram/callback
```

Instagram webhook route:

```text
/api/webhooks/instagram
```

Current limitations:

- LinkedIn text/image publishing needs approved credentials and staging
  validation.
- Facebook publishing requires Page selection and Page-token persistence.
- Instagram publishing requires a Meta-backed professional account flow.
- Provider-native engagement analytics are not live yet.
- Video, carousel, and richer media publishing flows are pending.

## Security Model

- Browser clients never publish directly to providers.
- Provider tokens are encrypted before database persistence.
- Raw provider tokens are only decrypted inside server-only publishing code.
- Supabase RLS protects user-owned data.
- Publishing uses jobs, attempts, retries, and normalized errors.
- Worker execution requires `PUBLISH_WORKER_SECRET`.
- Cron invocation uses Supabase Vault and a JWT-protected Edge Function.

## Documentation

Important docs:

- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md): living technical context
- [docs/SETUP.md](./docs/SETUP.md): setup and deployment notes
- [docs/REPOST_V2_PHASE0.md](./docs/REPOST_V2_PHASE0.md): discovery and target architecture
- [docs/REPOST_V2_NAV_PHASE9.md](./docs/REPOST_V2_NAV_PHASE9.md): latest safe E2E expansion
- [docs/REPOST_V2_MARKETING_PHASE1.md](./docs/REPOST_V2_MARKETING_PHASE1.md): public landing page implementation notes
- [docs/NETLIFY_DEPLOYMENT.md](./docs/NETLIFY_DEPLOYMENT.md): Netlify deployment, environment, callback, and cron notes

Phase docs are intentionally kept in the repo so future developers and coding
agents can understand why the system is shaped this way.

## Contributing Notes

- Keep the build lean.
- Use native `fetch`; do not add axios.
- Use Zod at request and form boundaries.
- Keep provider secrets server-only.
- Prefer React Query for server state and Zustand for transient UI state.
- Update `PROJECT_CONTEXT.md` and relevant docs after meaningful architecture,
  schema, deployment, or behavior changes.
- Do not claim provider flows are complete unless they have been validated with
  controlled real accounts.
