-- Phase 6 social connection OAuth state table.
-- Stores only hashed state and encrypted PKCE verifier. Provider tokens must
-- never be exposed to the browser or stored as plaintext.

create table public.connection_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform public.social_platform not null,
  state_hash text not null,
  code_verifier_ciphertext text not null,
  redirect_path text not null default '/connections',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint connection_oauth_states_state_hash_not_blank check (char_length(trim(state_hash)) > 0),
  constraint connection_oauth_states_code_verifier_not_blank check (char_length(trim(code_verifier_ciphertext)) > 0),
  constraint connection_oauth_states_redirect_path_not_blank check (char_length(trim(redirect_path)) > 0),
  constraint connection_oauth_states_state_hash_unique unique (state_hash)
);

create index connection_oauth_states_user_platform_idx
on public.connection_oauth_states (user_id, platform, expires_at desc);

create index connection_oauth_states_state_hash_idx
on public.connection_oauth_states (state_hash)
where consumed_at is null;

alter table public.connection_oauth_states enable row level security;

create policy "connection_oauth_states_select_own" on public.connection_oauth_states
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "connection_oauth_states_insert_own" on public.connection_oauth_states
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "connection_oauth_states_update_own" on public.connection_oauth_states
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
