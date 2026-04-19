# RE-post v2 Navigation Expansion Phase 7 - Real Publish Adapters

Date: 2026-04-19

## Goal

Replace the disabled provider publishing boundary with real provider-specific
adapter code for LinkedIn, Facebook, and Instagram while keeping production
publishing opt-in through environment configuration.

## What Was Implemented

- Added `PUBLISH_PROVIDER_MODE=live` support.
- Added provider adapter modules:
  - `server/publishing/adapters/linkedin.ts`
  - `server/publishing/adapters/facebook.ts`
  - `server/publishing/adapters/instagram.ts`
  - `server/publishing/adapters/http.ts`
  - `server/publishing/adapters/types.ts`
- Added server-side media preparation in `server/publishing/media-assets.ts`.
- Publishing engine now loads ready post media once per job and passes normalized
  media metadata plus temporary signed URLs into provider adapters.
- LinkedIn adapter supports:
  - text posts through UGC Posts
  - image posts through register-upload, binary upload, then UGC publish
  - normalized unsupported-state errors for video
- Facebook adapter supports:
  - Page text posts through Graph `/feed`
  - single-image Page posts through Graph `/photos`
  - explicit failure until the connection represents a selected Facebook Page
- Instagram adapter supports:
  - single-image professional-account publishing through Graph media container
    creation and `media_publish`
  - permalink lookup after publish when available
  - explicit failure until the connection represents a Meta-backed Instagram
    professional account
- Provider errors are normalized and avoid leaking raw provider payloads to UI.
- Meta OAuth endpoints were updated to Graph v24.0.

## Provider Reality Check

The adapters are real code paths, but `PUBLISH_PROVIDER_MODE=disabled` remains
the safe default.

Production-ready now:

- backend-only provider dispatch
- LinkedIn text and image publishing path
- Facebook Page text/image publishing path once a Page token exists
- Instagram professional-account image publishing path once an IG Graph account
  token exists
- normalized adapter errors and retryable HTTP classification

Still pending:

- Facebook Page selection and Page-token persistence
- Instagram professional-account selection through Meta, replacing the current
  Basic Display profile record
- LinkedIn video processing
- Facebook video upload flow
- Instagram video/reel container status polling
- carousel/multi-media publishing
- provider app review and controlled real-account validation

## Security Notes

- Provider adapters run only in server-only modules.
- Raw access tokens enter adapters only after `server/connections/token-store.ts`
  decrypts them inside the backend worker path.
- Temporary Supabase signed media URLs are generated server-side for provider
  ingestion; storage remains private.
- Provider error payloads are reduced to normalized code/message/retryable
  values before persistence.
- Live provider calls require `PUBLISH_PROVIDER_MODE=live`, so local/dev worker
  testing remains safe by default.

## References Used

- LinkedIn Share on LinkedIn / UGC Posts:
  `https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin`
- Instagram Graph API media publishing reference:
  `https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media`
- Facebook Page publishing uses Meta Graph Page `/feed` and `/photos` patterns:
  `https://developers.facebook.com/docs/graph-api/reference/page/feed/` and
  `https://developers.facebook.com/docs/graph-api/reference/page/photos/`.
  The adapter keeps this gated behind Page-token selection because user profile
  tokens cannot safely publish Page posts.

## Tests

Passed locally:

```bash
npm run typecheck
npm run verify:schema
npm run check
npm run build
npm run test:e2e -- --reporter=line
npm audit --audit-level=high
```

The first Playwright run exposed a flaky post-submit navigation assertion in the
scheduled-post lifecycle test. The product flow had already created the
scheduled post, so the test now navigates directly to `/schedule` after submit
before asserting the record. The sidebar navigation remains covered in the main
navigation smoke test.
