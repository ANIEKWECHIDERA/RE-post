-- Phase 12 hardening indexes.
-- These indexes cover foreign keys reported by Supabase advisors. The unused
-- index advisories on an empty project are intentionally ignored for now.

create index if not exists activity_events_post_id_idx
on public.activity_events (post_id)
where post_id is not null;

create index if not exists activity_events_post_platform_target_id_idx
on public.activity_events (post_platform_target_id)
where post_platform_target_id is not null;

create index if not exists media_variants_user_id_idx
on public.media_variants (user_id);

create index if not exists post_media_assets_media_asset_id_idx
on public.post_media_assets (media_asset_id);

create index if not exists post_platform_targets_social_connection_id_idx
on public.post_platform_targets (social_connection_id)
where social_connection_id is not null;

create index if not exists publish_attempts_post_platform_target_id_idx
on public.publish_attempts (post_platform_target_id);

create index if not exists publish_attempts_user_id_idx
on public.publish_attempts (user_id);

create index if not exists publish_jobs_post_id_idx
on public.publish_jobs (post_id);

create index if not exists streak_events_post_id_idx
on public.streak_events (post_id)
where post_id is not null;

create index if not exists streak_state_last_successful_post_id_idx
on public.streak_state (last_successful_post_id)
where last_successful_post_id is not null;
