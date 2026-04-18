# RE-post v2 Phase 1: Foundation And Project Setup

Last updated: 2026-04-18

Phase status: complete.

## What Is Live

Phase 1 turns the root project into a Next.js App Router application with the required v2 foundation:

- Next.js 16.2.4 App Router
- TypeScript with strict checking
- Tailwind CSS
- shadcn/ui components installed through the shadcn MCP workflow
- Zustand composer UI store
- TanStack Query provider and example dashboard query hook
- Supabase SSR/browser/server client scaffolding
- Next.js `proxy.ts` for Supabase session refresh boundary
- Zod schemas for env, platform, post composer, and media metadata validation
- Fetch-only typed API utility
- Shared app error normalization utility
- Creator-focused dashboard shell
- Auth screen scaffolding
- Health route at `/api/health`
- `.env.example`
- One root dev command: `npm run dev`

## What Was Retired

The old v1 prototype files were removed from the active source tree after the v2 foundation passed checks:

- `app.js`
- `views/index.ejs`
- root `index.html`
- root `style.css`
- `test.html`
- `public/CSS/style.css`
- `instagram-api-int/index.js`
- `instagram-api-int/package.json`
- `instagram-api-int/package-lock.json`

The old `uploads/`, `node_modules/`, nested `instagram-api-int/node_modules/`, `.next/`, and `.vercel/` paths are ignored by git.

## Key Folder Structure

```text
app/
|-- (auth)/
|   |-- sign-in/page.tsx
|   `-- sign-up/page.tsx
|-- api/health/route.ts
|-- error.tsx
|-- globals.css
|-- layout.tsx
|-- loading.tsx
`-- page.tsx
components/
|-- layout/app-shell.tsx
|-- providers/app-providers.tsx
`-- ui/
features/
`-- dashboard/components/
hooks/
lib/
|-- env/
|-- errors/
|-- fetch/
|-- supabase/
schemas/
server/
|-- auth/
`-- publishing/
stores/
types/
docs/
public/images/
```

## Architecture Decisions

### Root App Boundary

The root project is now the v2 Next.js app. Route handlers under `app/api` are the backend entrypoint for user-facing HTTP operations. Future publishing logic stays server-only under `server/`.

### Supabase Boundary

Supabase is scaffolded but not required for local boot yet. This lets Phase 1 pass without real project credentials while still validating environment shape through Zod.

- `lib/supabase/client.ts`: browser client factory, returns `null` until env is configured.
- `lib/supabase/server.ts`: server client factory using cookies, returns `null` until env is configured.
- `lib/supabase/middleware.ts` and `proxy.ts`: session refresh boundary for Next.js 16.

Phase 3 will make auth fully functional and protected.

### State Management Boundary

- Zustand is used only for transient composer UI state in `stores/composer-store.ts`.
- TanStack Query is used for server state through `hooks/use-dashboard-summary.ts`.
- Zustand is not used as a server cache.

### Fetch-Only Data Layer

`lib/fetch/api-client.ts` wraps native `fetch`. No axios package is included in root dependencies.

### Publishing Boundary

`server/publishing/readiness.ts` is a server-only placeholder. It validates draft/media readiness with Zod and documents why publish payloads and provider tokens stay off the client. Phase 7 will replace this with the job-backed engine.

## shadcn/ui Components Added

Added through shadcn MCP command:

```bash
npx shadcn@latest add @shadcn/button @shadcn/card @shadcn/badge @shadcn/input @shadcn/textarea @shadcn/avatar @shadcn/skeleton @shadcn/separator --yes
```

Generated components live in `components/ui/`.

## Current UI

The root page is a creator dashboard shell, not a landing page. It includes:

- Sidebar navigation
- Status header
- Creator streak hero
- Summary cards
- Composer preview
- Recent activity placeholder
- Supabase setup status

The dashboard intentionally marks unfinished areas as scaffolded or pending instead of pretending they are live.

## Testing And Verification

Commands run:

```bash
npm run typecheck
npm run lint
npm run build
npm run check
npm audit
```

Results:

- Typecheck passes.
- ESLint passes.
- Production build passes.
- npm audit reports zero vulnerabilities after `npm audit fix`.
- Dev server boots with the single root command.

Dev boot verification:

```text
npm run dev -- --hostname 127.0.0.1 --port 3100
GET / -> 200
GET /api/health -> 200
```

Health response:

```json
{"ok":true,"app":"re-post-v2","phase":1,"supabaseConfigured":false}
```

`supabaseConfigured` is expected to be `false` until real Supabase environment variables are added.

## Production-Ready vs Scaffolded

Production-minded foundation:

- Next.js root app
- strict TypeScript
- lint/type/build scripts
- Tailwind and shadcn baseline
- fetch-only utility
- Zod schemas
- Supabase client boundaries
- server-only publishing boundary
- root command

Scaffolded, not production-complete:

- Auth forms are disabled placeholders until Phase 3.
- Dashboard data is mocked through a TanStack Query hook until Phase 2/4.
- Realtime feed is visual scaffolding until Supabase tables and subscriptions exist.
- Publishing readiness is not a publish engine.
- Social connections are not implemented yet.
- Scheduling is not implemented yet.

## What Remains

Phase 2 should implement the Supabase database schema, RLS policies, storage bucket rules, indexes, enums, and ownership tests.
