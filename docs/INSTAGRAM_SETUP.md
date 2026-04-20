# Instagram API Setup

Date: 2026-04-20

This app is now aligned to the newer Instagram API setup with Instagram login
for business/professional accounts.

## Environment Variables

Use the Instagram app values from Meta:

```text
INSTAGRAM_CLIENT_ID=1235873701187593
INSTAGRAM_CLIENT_SECRET=<copy from Meta dashboard>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<random app-defined token>
```

Generate the webhook verify token locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit the app secret or webhook verify token.

## OAuth Callback

Use this URL for Instagram Business Login / OAuth redirect settings:

```text
https://re-post.netlify.app/api/connections/instagram/callback
```

For local development, use:

```text
http://localhost:3000/api/connections/instagram/callback
```

RE-post generates Instagram Business Login authorization URLs with:

```text
https://www.instagram.com/oauth/authorize
```

and includes:

```text
enable_fb_login=0
force_authentication=1
```

If Meta returns `Invalid platform app`, confirm the Instagram app id is used as
`INSTAGRAM_CLIENT_ID`, the redirect URL above is saved in Instagram Business
Login settings, and the latest deployment includes this Business Login endpoint
change.

## Webhook Callback

The webhook callback is different from the OAuth callback.

Use this URL in the Instagram webhook configuration:

```text
https://re-post.netlify.app/api/webhooks/instagram
```

For the webhook verify token field, paste the same value as
`INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.

The endpoint supports:

- Meta GET challenge verification.
- Signed POST delivery verification with `x-hub-signature-256`.
- Safe acknowledgement of valid webhook events without storing raw payloads.

Comment moderation and messaging workflows are not productized yet, so webhook
event persistence is intentionally pending.

## Permissions

Current Instagram OAuth scopes in source:

```text
instagram_business_basic
instagram_business_content_publish
instagram_manage_comments
instagram_business_manage_messages
```

`instagram_business_content_publish` is included because RE-post needs publishing
permissions for the Instagram media container and publish flow.

## Tester Account

The Meta dashboard currently shows:

```text
Instagram account: dwbbacademy
Instagram account id: 17841467401631508
```

Make sure that account has the Instagram Tester role while the app is in
development mode.

## Current App Behavior

- OAuth stores connected Instagram accounts as `instagram_professional` when a
  provider account id is returned.
- Provider tokens are encrypted before persistence.
- Raw Instagram tokens are never returned to the browser.
- Publishing still requires `PUBLISH_PROVIDER_MODE=live` and controlled
  real-account validation.
- Webhooks are verification-ready, but comment/message handling is pending.
