-- Navigation expansion Phase 6: token lifecycle metadata.
-- Token ciphertext already lives in social_connections. These columns make the
-- encrypted-token lifecycle auditable without exposing raw provider secrets.

alter table public.social_connections
add column if not exists token_refreshed_at timestamptz,
add column if not exists token_last_checked_at timestamptz,
add column if not exists token_last_refresh_attempt_at timestamptz,
add column if not exists token_key_version text not null default 'v1';

alter table public.social_connections
add constraint social_connections_token_key_version_not_blank
check (char_length(trim(token_key_version)) > 0);

create index if not exists social_connections_token_expiry_idx
on public.social_connections (user_id, platform, token_expires_at)
where status = 'active' and token_expires_at is not null;
