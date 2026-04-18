# RE-post v2 Phase 3: Auth And User Account System

Last updated: 2026-04-18

Phase status: complete in app source. Live Supabase auth execution is pending a configured Supabase project and applied Phase 2 migration.

## What Is Live In Source

Phase 3 wires the app around Supabase Auth:

- real sign-up server action
- real sign-in server action
- real sign-out server action
- Zod auth schemas
- protected `/dashboard` route group
- session-aware root redirect
- auth pages at `/sign-in` and `/sign-up`
- server-side current-user lookup
- profile/streak bootstrap repair helper
- clear setup blocker when Supabase env is missing
- health endpoint now reports `phase: 3`

## Key Files

- `schemas/auth.ts`
- `server/auth/actions.ts`
- `server/auth/session.ts`
- `server/profiles/bootstrap.ts`
- `components/auth/auth-form.tsx`
- `components/auth/auth-card-shell.tsx`
- `components/auth/supabase-setup-required.tsx`
- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/page.tsx`
- `components/layout/app-shell.tsx`

## Route Behavior

### `/`

Redirects to `/dashboard`.

### `/dashboard`

Protected route.

Behavior:

- If Supabase env is missing, shows `SupabaseSetupRequired`.
- If Supabase is configured but there is no authenticated user, redirects to `/sign-in`.
- If authenticated, validates/repairs profile and streak bootstrap rows, then renders the app shell and dashboard.

### `/sign-in`

Shows the sign-in form.

Behavior:

- If Supabase env is missing, form is disabled and the page explains setup is needed.
- If a user is already authenticated, redirects to `/dashboard`.
- On submit, validates with Zod and calls `supabase.auth.signInWithPassword`.

### `/sign-up`

Shows the sign-up form.

Behavior:

- If Supabase env is missing, form is disabled and the page explains setup is needed.
- If a user is already authenticated, redirects to `/dashboard`.
- On submit, validates with Zod and calls `supabase.auth.signUp`.
- Creator display name and timezone are saved into `user_metadata`.
- If email confirmation is enabled and no session is returned, the form reports that the account was created and email confirmation may be required.

### Sign Out

The authenticated app shell includes a sign-out button that calls `supabase.auth.signOut` server-side, revalidates the app layout, and redirects to `/sign-in`.

## Validation

Auth input validation uses Zod:

- `emailSchema`
- `passwordSchema`
- `signInSchema`
- `signUpSchema`

The UI performs basic browser constraints, but server actions are the real validation boundary.

## Security Decisions

- Auth mutations are server actions, not client-only calls.
- Raw Supabase auth errors are normalized before user display.
- Protected routes load user identity server-side with `supabase.auth.getUser`.
- The dashboard is not publicly available once Supabase is configured.
- Profile bootstrap uses owner-scoped Supabase writes and depends on Phase 2 RLS.
- No service role key is used in Phase 3 app paths.

## Profile Bootstrap

Phase 2 adds an auth trigger that creates:

- `profiles`
- `streak_state`
- initial `activity_events`

Phase 3 adds `ensureProfileBootstrap(user)` as a defensive repair path for:

- imported users
- environments where the trigger was added after users already existed
- future auth/provider migration scenarios

If bootstrap fails, the app shows the setup blocker instead of leaking raw database errors.

## Testing And Verification

Commands run:

```bash
npm run check
npm run build
npm audit
```

Results:

- Typecheck passes.
- ESLint passes.
- Production build passes.
- npm audit reports zero vulnerabilities.

Route smoke test in the current no-Supabase environment:

```text
GET / -> 200
GET /dashboard -> 200
GET /sign-in -> 200
GET /sign-up -> 200
GET /api/health -> 200
```

Health response:

```json
{"ok":true,"app":"re-post-v2","phase":3,"supabaseConfigured":false}
```

## Verification Gap

Live sign up, sign in, sign out, profile bootstrap, and user-isolation verification require:

1. a Supabase project
2. Phase 2 migration applied
3. `.env` populated with Supabase keys

Without those, Phase 3 can only verify local route stability and source-level correctness.

## Production-Ready vs Scaffolded

Production-minded:

- server-side auth actions
- protected route boundary
- Zod auth validation
- session-aware redirects
- sign-out path
- profile bootstrap repair path
- no raw auth error leakage

Still pending:

- live Supabase auth execution in this workspace
- email confirmation UX polish
- password reset flow
- OAuth provider flows
- authenticated dashboard data loading
- explicit RLS CRUD tests against a real database

## What Remains

Phase 4 should build the real-time creator dashboard home:

- load profile/streak/dashboard data from Supabase
- use TanStack Query for server state
- add Supabase Realtime subscriptions for activity/status/streak changes
- improve loading, empty, and setup states
- keep dashboard UX clean and creator-first
