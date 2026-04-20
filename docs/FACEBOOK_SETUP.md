# Facebook Setup

Date: 2026-04-20

RE-post can connect Facebook accounts through Meta OAuth, but Facebook Page
publishing has an additional permission and Page-token step.

## Environment Variables

```text
FACEBOOK_CLIENT_ID=469923632624825
FACEBOOK_CLIENT_SECRET=<copy from Meta dashboard>
```

Do not commit the app secret.

## OAuth Callback

Use this callback URL in the Meta app settings:

```text
https://re-post.netlify.app/api/connections/facebook/callback
```

For local development:

```text
http://localhost:3000/api/connections/facebook/callback
```

## Current Connect Scopes

RE-post currently requests:

```text
public_profile
pages_show_list
pages_read_engagement
```

These scopes let the app complete a safer baseline connection and prepare for
Page discovery.

## Page Publishing Permission

Facebook Page publishing needs:

```text
pages_manage_posts
```

This permission is intentionally not requested in the initial connect flow right
now because Meta returned:

```text
Invalid Scopes: pages_manage_posts
```

That means the current Meta app setup cannot request that permission in the
active login flow yet. Add/request it only after the Meta app has the required
product setup, role/app review access, and Page publishing validation path.

Until then, Facebook connection can be established, but actual Facebook Page
publishing remains pending Page-token selection and `pages_manage_posts` access.
