-- RE-post v2 Phase 2 schema.
-- This migration defines the durable data contract for auth-owned creator data,
-- media metadata, publish jobs, realtime activity, streaks, and analytics.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.social_platform as enum ('linkedin', 'facebook', 'instagram');
create type public.social_connection_status as enum ('pending', 'active', 'expired', 'revoked', 'error');
create type public.media_kind as enum ('image', 'video');
create type public.media_asset_status as enum ('uploaded', 'processing', 'ready', 'rejected', 'deleted');
create type public.post_status as enum ('draft', 'scheduled', 'queued', 'publishing', 'published', 'partially_failed', 'failed', 'canceled');
create type public.schedule_mode as enum ('now', 'scheduled');
create type public.post_target_status as enum ('draft', 'pending', 'queued', 'publishing', 'published', 'failed', 'retry_scheduled', 'canceled');
create type public.publish_job_status as enum ('queued', 'claimed', 'running', 'succeeded', 'partially_failed', 'failed', 'canceled');
create type public.publish_attempt_status as enum ('started', 'succeeded', 'failed');
create type public.activity_event_type as enum (
  'profile_bootstrapped',
  'social_connection_created',
  'social_connection_updated',
  'media_uploaded',
  'media_validated',
  'post_created',
  'post_updated',
  'post_scheduled',
  'publish_queued',
  'publish_started',
  'publish_succeeded',
  'publish_failed',
  'retry_scheduled',
  'streak_updated'
);
create type public.streak_event_type as enum ('incremented', 'maintained', 'missed', 'recovered', 'reset');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle citext unique,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_length check (handle is null or char_length(handle::text) between 3 and 32),
  constraint profiles_timezone_not_blank check (char_length(trim(timezone)) > 0)
);

create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform public.social_platform not null,
  provider_account_id text not null,
  display_name text,
  handle text,
  avatar_url text,
  scopes text[] not null default '{}',
  status public.social_connection_status not null default 'pending',
  -- Tokens are stored as opaque ciphertext only. The browser should never read,
  -- decrypt, or receive provider credentials. Phase 6 will implement encryption.
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_error_code text,
  last_error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_connections_provider_account_not_blank check (char_length(trim(provider_account_id)) > 0),
  constraint social_connections_unique_account unique (user_id, platform, provider_account_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'post-media',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null,
  kind public.media_kind not null,
  width integer,
  height integer,
  duration_seconds numeric(12, 3),
  aspect_ratio numeric(12, 6),
  checksum text,
  status public.media_asset_status not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint media_assets_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
  constraint media_assets_original_filename_not_blank check (char_length(trim(original_filename)) > 0),
  constraint media_assets_mime_type_not_blank check (char_length(trim(mime_type)) > 0),
  constraint media_assets_byte_size_positive check (byte_size > 0),
  constraint media_assets_dimensions_positive check (
    (width is null or width > 0) and
    (height is null or height > 0) and
    (duration_seconds is null or duration_seconds > 0) and
    (aspect_ratio is null or aspect_ratio > 0)
  ),
  constraint media_assets_unique_storage_path unique (storage_bucket, storage_path)
);

create table public.media_variants (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform public.social_platform,
  storage_bucket text not null default 'post-media',
  storage_path text not null,
  width integer,
  height integer,
  mime_type text not null,
  byte_size bigint not null,
  transform_strategy text not null default 'original',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint media_variants_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
  constraint media_variants_byte_size_positive check (byte_size > 0),
  constraint media_variants_dimensions_positive check (
    (width is null or width > 0) and
    (height is null or height > 0)
  ),
  constraint media_variants_unique_storage_path unique (storage_bucket, storage_path)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  status public.post_status not null default 'draft',
  schedule_mode public.schedule_mode not null default 'now',
  scheduled_at timestamptz,
  timezone text not null default 'UTC',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint posts_body_max_length check (char_length(body) <= 3000),
  constraint posts_scheduled_requires_time check (
    (schedule_mode = 'scheduled' and scheduled_at is not null) or
    (schedule_mode = 'now')
  ),
  constraint posts_timezone_not_blank check (char_length(trim(timezone)) > 0)
);

create table public.post_media_assets (
  post_id uuid not null references public.posts(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, media_asset_id),
  constraint post_media_assets_sort_order_nonnegative check (sort_order >= 0)
);

create table public.post_platform_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  social_connection_id uuid references public.social_connections(id) on delete set null,
  platform public.social_platform not null,
  status public.post_target_status not null default 'draft',
  platform_body text,
  settings jsonb not null default '{}'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,
  provider_publish_id text,
  provider_permalink text,
  last_error_code text,
  last_error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_platform_targets_body_max_length check (platform_body is null or char_length(platform_body) <= 3000),
  constraint post_platform_targets_unique_platform unique (post_id, platform)
);

create table public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  status public.publish_job_status not null default 'queued',
  run_at timestamptz not null default now(),
  claimed_at timestamptz,
  locked_until timestamptz,
  worker_id text,
  attempts_count integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text not null,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publish_jobs_attempts_nonnegative check (attempts_count >= 0),
  constraint publish_jobs_max_attempts_positive check (max_attempts > 0),
  constraint publish_jobs_idempotency_not_blank check (char_length(trim(idempotency_key)) > 0),
  constraint publish_jobs_idempotency_unique unique (idempotency_key)
);

create table public.publish_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  publish_job_id uuid not null references public.publish_jobs(id) on delete cascade,
  post_platform_target_id uuid not null references public.post_platform_targets(id) on delete cascade,
  platform public.social_platform not null,
  attempt_number integer not null,
  status public.publish_attempt_status not null default 'started',
  provider_request_id text,
  provider_publish_id text,
  normalized_error_code text,
  normalized_error_message text,
  retry_after timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint publish_attempts_attempt_number_positive check (attempt_number > 0),
  constraint publish_attempts_unique_attempt unique (publish_job_id, post_platform_target_id, attempt_number)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  post_platform_target_id uuid references public.post_platform_targets(id) on delete set null,
  type public.activity_event_type not null,
  title text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_title_not_blank check (char_length(trim(title)) > 0)
);

create table public.streak_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  current_count integer not null default 0,
  longest_count integer not null default 0,
  last_counted_on date,
  last_successful_post_id uuid references public.posts(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint streak_state_counts_nonnegative check (current_count >= 0 and longest_count >= 0),
  constraint streak_state_timezone_not_blank check (char_length(trim(timezone)) > 0)
);

create table public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  event_date date not null,
  type public.streak_event_type not null,
  previous_count integer not null default 0,
  new_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint streak_events_counts_nonnegative check (previous_count >= 0 and new_count >= 0),
  constraint streak_events_unique_day unique (user_id, event_date, type)
);

create table public.analytics_daily_rollups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rollup_date date not null,
  platform public.social_platform,
  posts_created integer not null default 0,
  posts_published integer not null default 0,
  publish_successes integer not null default 0,
  publish_failures integer not null default 0,
  scheduled_posts integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_daily_rollups_counts_nonnegative check (
    posts_created >= 0 and
    posts_published >= 0 and
    publish_successes >= 0 and
    publish_failures >= 0 and
    scheduled_posts >= 0
  ),
  constraint analytics_daily_rollups_unique unique (user_id, rollup_date, platform)
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_social_connections_updated_at
before update on public.social_connections
for each row execute function public.set_updated_at();

create trigger set_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger set_post_platform_targets_updated_at
before update on public.post_platform_targets
for each row execute function public.set_updated_at();

create trigger set_publish_jobs_updated_at
before update on public.publish_jobs
for each row execute function public.set_updated_at();

create trigger set_analytics_daily_rollups_updated_at
before update on public.analytics_daily_rollups
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  )
  on conflict (id) do nothing;

  insert into public.streak_state (user_id, timezone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  )
  on conflict (user_id) do nothing;

  insert into public.activity_events (user_id, type, title, message)
  values (
    new.id,
    'profile_bootstrapped',
    'Creator profile created',
    'Your creator workspace is ready.'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index profiles_handle_idx on public.profiles (handle);
create index social_connections_user_platform_idx on public.social_connections (user_id, platform, status);
create index media_assets_user_status_idx on public.media_assets (user_id, status, created_at desc);
create index media_variants_asset_idx on public.media_variants (media_asset_id);
create index posts_user_status_idx on public.posts (user_id, status, created_at desc);
create index posts_user_scheduled_idx on public.posts (user_id, scheduled_at) where scheduled_at is not null;
create index post_media_assets_user_idx on public.post_media_assets (user_id, post_id);
create index post_platform_targets_user_status_idx on public.post_platform_targets (user_id, status, platform);
create index publish_jobs_due_idx on public.publish_jobs (status, run_at, locked_until);
create index publish_jobs_user_status_idx on public.publish_jobs (user_id, status, run_at);
create index publish_attempts_job_idx on public.publish_attempts (publish_job_id, attempt_number);
create index activity_events_user_created_idx on public.activity_events (user_id, created_at desc);
create index streak_events_user_date_idx on public.streak_events (user_id, event_date desc);
create index analytics_daily_rollups_user_date_idx on public.analytics_daily_rollups (user_id, rollup_date desc);

alter table public.profiles enable row level security;
alter table public.social_connections enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_variants enable row level security;
alter table public.posts enable row level security;
alter table public.post_media_assets enable row level security;
alter table public.post_platform_targets enable row level security;
alter table public.publish_jobs enable row level security;
alter table public.publish_attempts enable row level security;
alter table public.activity_events enable row level security;
alter table public.streak_state enable row level security;
alter table public.streak_events enable row level security;
alter table public.analytics_daily_rollups enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "social_connections_select_own" on public.social_connections
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "social_connections_insert_own" on public.social_connections
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "social_connections_update_own" on public.social_connections
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "social_connections_delete_own" on public.social_connections
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "media_assets_select_own" on public.media_assets
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "media_assets_insert_own" on public.media_assets
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "media_assets_update_own" on public.media_assets
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "media_assets_delete_own" on public.media_assets
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "media_variants_select_own" on public.media_variants
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "media_variants_insert_own" on public.media_variants
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "media_variants_update_own" on public.media_variants
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "posts_select_own" on public.posts
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "posts_insert_own" on public.posts
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "posts_update_own" on public.posts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "posts_delete_own" on public.posts
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "post_media_assets_select_own" on public.post_media_assets
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "post_media_assets_insert_own" on public.post_media_assets
for insert to authenticated
with check (
  (select auth.uid()) = user_id and
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid())) and
  exists (select 1 from public.media_assets m where m.id = media_asset_id and m.user_id = (select auth.uid()))
);

create policy "post_media_assets_delete_own" on public.post_media_assets
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "post_platform_targets_select_own" on public.post_platform_targets
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "post_platform_targets_insert_own" on public.post_platform_targets
for insert to authenticated
with check (
  (select auth.uid()) = user_id and
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid()))
);

create policy "post_platform_targets_update_own" on public.post_platform_targets
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "post_platform_targets_delete_own" on public.post_platform_targets
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "publish_jobs_select_own" on public.publish_jobs
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "publish_jobs_insert_own" on public.publish_jobs
for insert to authenticated
with check (
  (select auth.uid()) = user_id and
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid()))
);

create policy "publish_jobs_update_own" on public.publish_jobs
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "publish_attempts_select_own" on public.publish_attempts
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "publish_attempts_insert_own" on public.publish_attempts
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "activity_events_select_own" on public.activity_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "activity_events_insert_own" on public.activity_events
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "streak_state_select_own" on public.streak_state
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "streak_state_insert_own" on public.streak_state
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "streak_state_update_own" on public.streak_state
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "streak_events_select_own" on public.streak_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "streak_events_insert_own" on public.streak_events
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "analytics_daily_rollups_select_own" on public.analytics_daily_rollups
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "analytics_daily_rollups_insert_own" on public.analytics_daily_rollups
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "analytics_daily_rollups_update_own" on public.analytics_daily_rollups
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Storage bucket for original media and future prepared variants. Objects are
-- keyed by first path segment = auth user id to prevent cross-user access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "post_media_objects_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'post-media' and
  (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_media_objects_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'post-media' and
  (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_media_objects_update_own" on storage.objects
for update to authenticated
using (
  bucket_id = 'post-media' and
  (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'post-media' and
  (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_media_objects_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'post-media' and
  (storage.foldername(name))[1] = (select auth.uid())::text
);
