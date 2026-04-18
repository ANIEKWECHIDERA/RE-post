# RE-post v2 Phase 5: Post Composer v2

Last updated: 2026-04-19

Phase status: complete in app source. Full media/post persistence verification requires a linked Supabase project with migrations applied and an authenticated user.

## What Is Live In Source

Phase 5 adds a serious composer foundation:

- protected `/compose` route
- creator-facing composer UI
- Zustand-backed draft UI state
- platform selector for Instagram, Facebook, and LinkedIn
- browser media metadata inspection
- platform-aware media warnings
- schedule mode selection
- future datetime scheduling input
- server action for creating posts
- Supabase Storage upload path
- media metadata persistence
- post/media join persistence
- per-platform target creation
- publish job creation
- activity event creation
- dashboard CTA and sidebar navigation to composer
- health endpoint now reports `phase: 5`

## Key Files

- `app/(app)/compose/page.tsx`
- `features/composer/components/post-composer.tsx`
- `features/composer/media-validation.ts`
- `server/composer/actions.ts`
- `schemas/media.ts`
- `schemas/post.ts`
- `components/layout/app-shell.tsx`
- `features/dashboard/components/creator-dashboard.tsx`

## Composer Flow

The UI lets an authenticated creator:

1. write post text
2. select one or more platforms
3. upload media files
4. inspect browser-detected media metadata
5. review platform-aware warnings
6. choose post now or schedule
7. submit the post to a server action

The server action:

1. validates form data with Zod
2. verifies the user session server-side
3. validates supported MIME types and file size
4. creates a `posts` row
5. uploads files to private Supabase Storage under `{user_id}/{post_id}/...`
6. creates `media_assets` rows
7. links media with `post_media_assets`
8. creates `post_platform_targets`
9. creates a `publish_jobs` row
10. creates an `activity_events` row

## Media Validation

Live in Phase 5:

- accepted MIME type validation
- 100 MB file size limit
- image dimensions from browser metadata
- video dimensions/duration from browser metadata
- aspect ratio calculation
- platform-aware warnings against target dimensions
- warnings sent to the server and stored with media metadata

Not live yet:

- authoritative server-side dimension extraction
- automatic image/video transformation
- preview of transformed variants
- provider-specific upload protocols

Auto-transform is intentionally not implemented yet. The app warns creators first; silent transforms would be risky without previews and provider-specific output checks.

## Platform Guidance Targets

The composer uses the 2026 platform constraints from the product brief:

- LinkedIn shared image/link: `1200 x 627`
- LinkedIn video: `1920 x 1080` or `1080 x 1350`
- Facebook image: `1080 x 1350` or `1080 x 1080`
- Instagram square: `1080 x 1080`
- Instagram portrait: `1080 x 1350`
- Instagram landscape: `1080 x 566`

## Publishing Status

Phase 5 creates publish jobs but does not execute provider publishing.

For post now:

- `posts.status = queued`
- `post_platform_targets.status = pending`
- `publish_jobs.status = queued`
- `publish_jobs.run_at = now`

For scheduled posts:

- `posts.status = scheduled`
- `post_platform_targets.status = queued`
- `publish_jobs.status = queued`
- `publish_jobs.run_at = scheduledAt`

The real publishing worker comes in Phase 7. Scheduling execution and safe job claiming come in Phase 8.

## Supabase Migration Attempt

The user asked to apply Supabase migrations.

Attempted command:

```bash
npx supabase db push
```

Result:

```text
Cannot find project ref. Have you run supabase link?
```

Earlier CLI check also showed:

```text
Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

So migrations were not applied from this workspace. The project needs to be linked/authenticated first:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not commit access tokens or database passwords.

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
GET /compose -> 200
GET /api/health -> 200
```

Health response after Phase 5:

```json
{"ok":true,"app":"re-post-v2","phase":5,"supabaseConfigured":true}
```

## Verification Gap

The full composer persistence flow was not executed because it requires:

- Supabase project linked/authenticated for migrations
- Phase 2 and Phase 4 migrations applied
- authenticated user session
- private `post-media` bucket available

Once those are ready, verify:

- text-only post now
- text-only scheduled post
- image upload
- video upload
- unsupported file type rejection
- oversize file rejection
- platform warnings stored on `media_assets`
- post targets created for selected platforms
- publish job created with correct `run_at`
- activity event inserted

## Production-Ready vs Scaffolded

Production-minded:

- server-side mutation boundary
- Supabase Storage upload path
- private user-scoped storage keys
- Zod validation
- platform-aware warning architecture
- draft UI state kept in Zustand
- publish job creation instead of direct provider calls

Still scaffolded:

- no actual provider publishing yet
- no media transformation yet
- no server-side dimension extraction yet
- no authenticated live persistence verification yet
- no upload progress bar yet
- no draft autosave yet

## What Remains

Phase 6 should implement social connection architecture:

- provider connection records
- secure token handling architecture
- OAuth scaffolding per provider
- connection lifecycle UI
- provider-specific validation
- explicit live vs pending connection states
