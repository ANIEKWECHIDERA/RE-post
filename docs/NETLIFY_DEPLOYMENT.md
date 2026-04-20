# Netlify Deployment

Date: 2026-04-20

This app is a Next.js App Router project. Netlify's current Next.js support uses
the OpenNext adapter automatically for SSR, route handlers, image optimization,
and middleware/proxy behavior. The repository includes `netlify.toml` so the
build command, publish directory, Node version, and security headers are explicit.

References:

- https://docs.netlify.com/frameworks/next-js/overview/
- https://opennext.js.org/netlify

## Build Settings

Netlify should use:

```text
Build command: npm run build
Publish directory: .next
Node version: 22
```

These values are already captured in `netlify.toml`.

## Required Environment Variables

Add these in Netlify under Site configuration -> Environment variables.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOKEN_ENCRYPTION_KEY=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
PUBLISH_WORKER_SECRET=
PUBLISH_WORKER_URL=
PUBLISH_PROVIDER_MODE=disabled
```

Do not add `SUPABASE_ACCESS_TOKEN` to Netlify unless a deployment task truly
needs the Supabase CLI. The runtime app does not need it.

Safe provider modes:

- `disabled`: safest production default while provider app review is incomplete.
- `mock`: internal publishing-engine testing only.
- `live`: controlled staging/production validation with approved provider apps.

## First Deploy Flow

1. Create a new Netlify site from this repository.
2. Confirm Netlify detects the project as Next.js.
3. Add the environment variables above.
4. Deploy.
5. Copy the deployed production URL.
6. Update `PUBLISH_WORKER_URL` to:

```text
https://your-netlify-domain.netlify.app/api/publish/run
```

7. Redeploy after changing `PUBLISH_WORKER_URL`.

## Provider Callback URLs

After Netlify gives you a production domain, add these redirect URLs to the
provider developer dashboards.

```text
https://your-netlify-domain.netlify.app/api/connections/linkedin/callback
https://your-netlify-domain.netlify.app/api/connections/facebook/callback
https://your-netlify-domain.netlify.app/api/connections/instagram/callback
```

For Meta app details, use these public pages:

```text
Privacy Policy URL: https://your-netlify-domain.netlify.app/privacy
Terms of Service URL: https://your-netlify-domain.netlify.app/terms
User Data Deletion URL: https://your-netlify-domain.netlify.app/data-deletion
```

Replace the Netlify subdomain with the custom production domain once one is
attached.

## Supabase Auth URL Settings

In Supabase Auth settings, add the production site URL and redirect URLs:

```text
Site URL: https://your-netlify-domain.netlify.app
Additional Redirect URLs:
https://your-netlify-domain.netlify.app/**
```

If a custom domain is added later, add that domain too.

## Scheduled Publishing Cron

The Next.js worker route deployed on Netlify is:

```text
POST /api/publish/run
Authorization: Bearer <PUBLISH_WORKER_SECRET>
```

Before enabling the recurring Supabase cron job:

1. Confirm `PUBLISH_WORKER_URL` points to the deployed Netlify worker route.
2. Set the same `PUBLISH_WORKER_SECRET` in Netlify and Supabase Edge Function
   secrets.
3. Update Supabase Vault secrets used by
   `supabase/sql/repost_publish_worker_cron.sql`.
4. Install the recurring cron job from the SQL runbook.

Do not install the recurring cron job until the deployed worker URL and secrets
are confirmed.

## Post-Deploy Checks

Run these locally before pushing:

```bash
npm run check
npm run build
```

After Netlify deploys, verify:

- `/` loads the marketing page.
- `/privacy`, `/terms`, and `/data-deletion` load publicly.
- `/sign-in` and `/sign-up` load.
- `/api/health` returns JSON.
- `/dashboard` redirects unauthenticated users to `/sign-in`.
- `POST /api/publish/run` returns `401` without the worker secret.

## Notes

- Keep all provider secrets server-only in Netlify environment variables.
- Rotate the Meta app secret if it was shared outside the Meta dashboard.
- Leave `PUBLISH_PROVIDER_MODE=disabled` until provider credentials, callback
  URLs, app review, and controlled real-account validation are complete.
