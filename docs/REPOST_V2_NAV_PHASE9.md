# RE-post v2 Navigation Expansion Phase 9 - Safe App-Level E2E

Date: 2026-04-19

## Goal

Expand end-to-end coverage while provider credentials are being prepared, without
calling LinkedIn, Facebook, or Instagram APIs.

## What Was Implemented

The Playwright smoke suite now covers seven app-level flows:

- unauthenticated API requests are rejected safely
- authenticated creator can sign in, compose, queue a post, and navigate core
  app pages
- composer rejects unsupported media before a job is queued
- authenticated creator can save a draft and reopen it in Composer
- Drafts page only shows the signed-in creator's data
- authenticated creator can schedule, reschedule, and cancel a post
- publish worker can process a due job without provider credentials and record
  a normalized `connection_missing` failure

## Why This Is Safe

- No provider OAuth credentials are required.
- No social provider API calls are made.
- The worker test creates a due job with no social connection, invokes the local
  server worker with `PUBLISH_WORKER_SECRET`, and asserts that the target fails
  safely with `connection_missing`.
- Test users are created through Supabase Admin Auth and deleted after each
  test.
- Tenant isolation is verified by creating one creator's draft and signing in as
  another creator.

## Test Hardening Notes

The remote Supabase-backed dev flow can be slower than local UI state. The suite
now uses database polling for server-action outcomes that are more reliable as
data-state assertions:

- draft save persistence
- scheduled post cancellation

The sidebar navigation path remains covered in the main navigation smoke test.

## Production-Ready vs Pending

Production-minded and live:

- app-level auth flow coverage
- protected API guard coverage
- composer validation coverage
- draft lifecycle coverage
- schedule lifecycle coverage
- worker safe-failure coverage
- ownership isolation coverage

Still pending until credentials/accounts are ready:

- LinkedIn real-account OAuth callback validation
- LinkedIn text/image publish validation
- Facebook Page selection and Page publishing validation
- Instagram professional-account selection and image publishing validation
- cleanup of provider-created real posts after staging tests

## Tests

Passed locally:

```bash
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The expanded Playwright suite passed:

```text
7 passed
```
