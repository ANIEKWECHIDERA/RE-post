-- Phase 4 realtime publication setup.
-- These are intentionally high-signal tables for the dashboard home. Avoid
-- adding every table to realtime; the app should feel alive, not noisy.

alter table public.activity_events replica identity full;
alter table public.streak_state replica identity full;
alter table public.post_platform_targets replica identity full;
alter table public.posts replica identity full;
alter table public.social_connections replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'activity_events'
  ) then
    alter publication supabase_realtime add table public.activity_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'streak_state'
  ) then
    alter publication supabase_realtime add table public.streak_state;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'post_platform_targets'
  ) then
    alter publication supabase_realtime add table public.post_platform_targets;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'social_connections'
  ) then
    alter publication supabase_realtime add table public.social_connections;
  end if;
end;
$$;
