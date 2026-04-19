# RE-post v2 Navigation Expansion Phase 3 - Scheduled Posts Lifecycle

Date: 2026-04-19

## Goal

Make the Scheduled Posts page operational instead of read-only: creators can filter scheduled work, inspect details, edit captions, reschedule, cancel, duplicate to Drafts, and delete terminal scheduled posts.

## What Was Implemented

- Added date filtering alongside status and platform filtering.
- Scheduled cards now expose:
  - view details
  - edit caption
  - reschedule
  - duplicate to draft
  - cancel
  - delete after terminal failure/cancel
- Added secure scheduling server actions:
  - `editScheduledPostAction`
  - `reschedulePostAction`
  - `duplicateScheduledPostAction`
  - `deleteScheduledPostAction`
- Strengthened `cancelScheduledPostAction` with a safe fallback if the deployed RPC is older or misses a recoverable job state.
- Scheduled page now includes archived/canceled scheduled rows so terminal state is visible instead of disappearing after cancellation.
- Scheduled action forms invalidate React Query caches after mutation so realtime/RSC refreshes do not leave stale client state.
- Playwright now covers scheduling, rescheduling, and cancellation.

## Security Notes

- Every mutation requires the current authenticated user.
- Every mutation scopes by `user_id`.
- Edit/reschedule are blocked for actively publishing/published states.
- Delete is allowed only for terminal `canceled` or `failed` posts.
- Cancellation still prefers the Postgres RPC because it moves post, job, target, and audit state together.

## Production-Ready vs Pending

Production-minded:

- State-scoped ownership checks.
- Worker-safe rescheduling constraints.
- Cancel before delete lifecycle.
- Duplicate-to-draft recovery flow.
- Realtime/cache refresh after mutations.

Still pending:

- Dedicated modal UX for view/edit/reschedule.
- Server action result toasts for scheduled mutations.
- Bulk scheduled actions.
- Server-side pagination/filter query params.

## Tests

Passed:

```bash
npm run verify:schema
npm run check
npm run test:e2e -- --reporter=line
npm run build
npm audit --audit-level=high
```
