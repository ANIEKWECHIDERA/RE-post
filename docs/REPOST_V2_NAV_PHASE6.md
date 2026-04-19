# RE-post v2 Navigation Expansion Phase 6 - Secure Token Persistence

Date: 2026-04-19

## Goal

Turn OAuth token storage into an active, auditable server-side token boundary that
the publishing engine can use without ever exposing raw provider credentials to
client code.

## What Was Implemented

- Added token lifecycle metadata to `social_connections`:
  - `token_refreshed_at`
  - `token_last_checked_at`
  - `token_last_refresh_attempt_at`
  - `token_key_version`
- Added an active-token lookup service in `server/connections/token-store.ts`.
- The token store:
  - loads only active owned connections through the service-role boundary
  - updates last-checked timestamps for auditability
  - decrypts access tokens only in server-only code
  - marks missing, expired, refresh-failed, and decrypt-failed tokens cleanly
  - attempts refresh-token exchange when supported token data exists
- OAuth callback persistence now initializes lifecycle fields on connect.
- The publishing engine now requests an active provider token before invoking a
  provider adapter.
- Provider adapter input now receives only server-side decrypted token material,
  never ciphertext.
- Schema verification now covers the Phase 6 token lifecycle migration.

## Security Notes

- `server/connections/token-store.ts` is `server-only`.
- Raw provider tokens are decrypted in memory only inside server-side publishing
  code.
- Client queries still use sanitized connection records and do not expose token
  ciphertext or raw tokens.
- Refresh failures are normalized into connection status/error fields instead of
  leaking provider payloads to UI.
- `token_key_version` is stored now so a future key rotation can be tracked
  without changing every publishing call site.

## Production-Ready vs Scaffolded

Production-minded and live:

- encrypted token persistence
- server-only token retrieval boundary
- token lifecycle audit fields
- normalized token failure states
- publishing engine consumption of active tokens

Still pending provider-specific production validation:

- LinkedIn refresh-token behavior depends on the granted OAuth product/scopes.
- Facebook long-lived/page-token exchange still needs page selection work.
- Instagram Graph publishing needs professional account selection and Meta app
  review.
- Key rotation is metadata-ready but not yet automated.

## Migration

Applied remotely through Supabase MCP:

```text
repost_v2_phase6_token_lifecycle
```

Local migration file:

```text
supabase/migrations/202604190008_repost_v2_phase6_token_lifecycle.sql
```

## Tests

Passed locally after implementation:

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The Playwright app-level suite passed with sign-in, compose/navigation, draft,
and scheduled-post lifecycle coverage. Real provider token refresh validation
requires controlled provider test accounts.
