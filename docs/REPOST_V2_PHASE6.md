# RE-post v2 Phase 6: Social Connection Architecture

Last updated: 2026-04-19

Phase status: complete in app source. Full OAuth redirect/callback exchange remains pending provider app credentials and Supabase migrations applied.

## What Is Live In Source

Phase 6 adds the social account connection architecture:

- protected `/connections` route
- provider readiness cards for LinkedIn, Facebook, and Instagram
- secure provider config registry
- connection list query that never selects token ciphertext
- connection revoke server action
- OAuth state preparation server action
- encrypted PKCE verifier storage
- AES-256-GCM token vault helper
- Phase 6 migration for `connection_oauth_states`
- env placeholders for provider credentials and Supabase CLI token
- health endpoint now reports `phase: 6`

## Key Files

- `app/(app)/connections/page.tsx`
- `features/connections/components/connections-dashboard.tsx`
- `features/connections/components/connection-action-form.tsx`
- `server/connections/providers.ts`
- `server/connections/queries.ts`
- `server/connections/actions.ts`
- `server/security/token-vault.ts`
- `schemas/connection.ts`
- `supabase/migrations/202604190003_repost_v2_phase6_connection_oauth_states.sql`

## Security Boundary

Provider secrets and tokens are server-only.

Rules implemented in source:

- provider client secrets are read only through server env
- token encryption uses `TOKEN_ENCRYPTION_KEY`
- token vault uses AES-256-GCM with random IVs
- OAuth state is hashed before storage
- PKCE verifier is encrypted before storage
- connection UI never receives provider token ciphertext
- revoke action clears token ciphertext columns

## OAuth Status

Live:

- provider readiness detection
- OAuth state generation
- state hashing
- encrypted verifier persistence
- connection revocation
- provider config missing/ready UI

Pending:

- redirecting users to provider authorization URLs
- provider callback handlers
- code exchange
- provider profile/account discovery
- encrypted access/refresh token persistence
- token refresh logic
- provider app review/permissions

This is intentional. The app does not pretend a provider is connected before OAuth exchange exists.

## Provider Env Variables

`.env.example` now includes:

```text
SUPABASE_ACCESS_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
```

Do not commit real values.

## Supabase Migration Attempt

The user added `SUPABASE_ACCESS_TOKEN`, so migration push was retried.

Commands attempted:

```bash
npx supabase link --project-ref <project-ref>
```

Result:

```text
Invalid access token format. Must be like `sbp_0102...1920`.
```

The value currently in `.env` is not accepted by Supabase CLI as a personal access token. Migrations were not applied.

To apply migrations:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

or set a valid `SUPABASE_ACCESS_TOKEN` value that starts with Supabase's expected `sbp_` format.

## Testing And Verification

Commands run:

```bash
npm run verify:schema
npm run check
npm run build
npm audit
```

Results:

- schema verifier passes
- typecheck passes
- lint passes
- production build passes
- npm audit reports zero vulnerabilities

Route smoke test:

```text
GET /connections -> 200
GET /api/health -> 200
```

Health response:

```json
{"ok":true,"app":"re-post-v2","phase":6,"supabaseConfigured":true}
```

## Verification Gap

Live connection lifecycle verification requires:

- valid Supabase CLI authentication
- migrations applied
- authenticated app user
- provider client IDs/secrets for the relevant platform

Once ready, verify:

- provider config readiness changes when env vars are added
- OAuth state row is inserted
- `code_verifier_ciphertext` is encrypted
- state hash is unique
- revoke clears token ciphertext
- only owner can read/update their connections

## Production-Ready vs Scaffolded

Production-minded:

- secure server-only token vault
- OAuth state table with RLS
- no token ciphertext in UI query
- provider-specific config registry
- revoke lifecycle path
- honest provider readiness UX

Still scaffolded:

- no provider redirects
- no callback exchange
- no real provider tokens saved yet
- no token refresh worker
- no provider account discovery

## What Remains

Phase 7 should implement the publishing engine:

- job claiming
- per-platform provider adapters
- payload builders
- attempt records
- normalized provider errors
- retry scheduling
- target status updates
- activity events
- streak update trigger point
