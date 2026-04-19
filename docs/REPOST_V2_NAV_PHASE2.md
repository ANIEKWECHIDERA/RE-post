# RE-post v2 Navigation Expansion Phase 2 - Drafts Lifecycle

Date: 2026-04-19

## Goal

Turn Drafts from a read-only page foundation into a real lifecycle: save a draft from Composer, list it, reopen it for editing, duplicate it, delete it, and send or schedule it from the same composer flow.

## Architecture Decisions

- Drafts remain `posts` rows with `status = 'draft'`.
- Draft platform choices are stored in `post_platform_targets` with target `status = 'draft'`.
- Composer accepts an optional `draftId` query param and loads only drafts owned by the signed-in user.
- Sending or scheduling a draft is a state transition on the existing post row, not a new post copy.
- Draft delete is a hard delete only while `status = 'draft'`; queued/scheduled/publishing posts must use stricter lifecycle actions later.
- Existing draft media is preserved when reopening or saving text/platform changes. New uploads can be attached to the same draft.

## What Was Implemented

- `saveComposerDraftAction` for creating and updating draft posts.
- Composer “Save draft” button alongside Queue/Schedule.
- Composer draft hydration from `/compose?draftId=...`.
- Draft media preview preservation using short-lived signed URLs.
- Draft duplicate server action.
- Draft delete server action.
- Drafts page actions now link to edit/send/schedule composer flows and submit duplicate/delete mutations.
- E2E smoke test split into route/publish coverage and draft lifecycle coverage.

## Security Notes

- Draft reads and mutations require the current authenticated user.
- Mutations restrict by both `user_id` and `status = 'draft'`.
- Sending a draft updates only a draft row and creates a publish job after validation.
- Raw Storage paths and provider secrets are not returned to the client.

## What Works

- Create draft from Composer.
- View draft on Drafts page.
- Reopen draft in Composer with text/platforms hydrated.
- Preserve existing draft media attachment previews.
- Duplicate draft rows with platform targets and media links.
- Delete draft rows before they enter the queue.
- Send/schedule draft by opening it in Composer and using Queue/Schedule.

## Still Incomplete

- Inline draft edit modal on the Drafts page.
- Reschedule/cancel lifecycle for already scheduled posts.
- Server action status feedback on duplicate/delete forms.
- Full draft media management such as removing a single attached media item.

## Tests

Passed:

```bash
npm run verify:schema
npm run check
npm run test:e2e -- --reporter=line
npm run build
npm audit --audit-level=high
```
