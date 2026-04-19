# RE-post v2 Navigation Expansion Phase 5 - Provider OAuth Callbacks

Date: 2026-04-19

## Goal

Move social connection OAuth from "state prepared" scaffolding to real
provider redirect and callback handling for LinkedIn, Facebook, and Instagram.

## What Was Implemented

- Provider-specific callback routes:
  - `/api/connections/linkedin/callback`
  - `/api/connections/facebook/callback`
  - `/api/connections/instagram/callback`
- OAuth start flow now redirects to the configured provider instead of stopping after state creation.
- Callback handler verifies:
  - authenticated user
  - provider platform
  - state hash
  - state expiry
  - state not previously consumed
- Provider code exchange via server-side `fetch`.
- Provider profile fetch via server-side `fetch`.
- `social_connections` upsert with encrypted access/refresh tokens.
- OAuth success/failure activity events.
- Connections UI copy updated to reflect live callbacks.

## Security Notes

- Provider secrets are read only in server-only modules.
- Raw provider tokens never reach client components.
- Tokens are encrypted with the app token vault before persistence.
- OAuth state is stored hashed; raw state only travels through the provider redirect.
- Callback failures redirect to `/connections` with generic status instead of leaking provider payloads.

## Provider Notes

LinkedIn:

- Uses OAuth authorization-code flow.
- Uses OIDC `userinfo` for member identity.

Facebook:

- Uses Graph API token exchange and `/me` profile lookup.
- Page selection and page token persistence are still pending.

Instagram:

- Uses Instagram Basic Display style token/profile lookup.
- Instagram Graph publishing upgrade and professional-account selection are still pending.

## Still Pending

- Provider page/account selection for Facebook and Instagram Graph publishing.
- Token refresh lifecycle.
- Provider app review and production credentials.
- Real publish adapter consumption of stored encrypted tokens.
- Callback integration tests with real provider test accounts.

## Tests

Passed locally:

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The existing Playwright suite remains app-level only. Real provider callback
validation still requires controlled provider test apps/accounts.
