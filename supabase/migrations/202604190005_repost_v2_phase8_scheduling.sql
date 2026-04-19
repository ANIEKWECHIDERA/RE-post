-- Phase 8 scheduling helpers.
-- Cancellation is implemented as a database function so post, target, job, and
-- activity state move together under the caller's RLS-authenticated identity.

create or replace function public.cancel_scheduled_post(post_id_input uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid := auth.uid();
  canceled_count integer;
begin
  if owner_id is null then
    return false;
  end if;

  update public.posts
  set
    status = 'canceled',
    archived_at = coalesce(archived_at, now()),
    updated_at = now()
  where id = post_id_input
    and user_id = owner_id
    and status in ('scheduled', 'queued')
    and not exists (
      select 1
      from public.publish_jobs jobs
      where jobs.post_id = posts.id
        and jobs.status in ('claimed', 'running', 'succeeded')
    );

  get diagnostics canceled_count = row_count;

  if canceled_count = 0 then
    return false;
  end if;

  update public.publish_jobs
  set
    status = 'canceled',
    locked_until = null,
    worker_id = null,
    last_error_code = null,
    last_error_message = null,
    updated_at = now()
  where post_id = post_id_input
    and user_id = owner_id
    and status in ('queued', 'failed');

  update public.post_platform_targets
  set
    status = 'canceled',
    last_error_code = null,
    last_error_message = null,
    updated_at = now()
  where post_id = post_id_input
    and user_id = owner_id
    and status in ('draft', 'pending', 'queued', 'retry_scheduled');

  insert into public.activity_events (
    user_id,
    post_id,
    type,
    title,
    message,
    metadata
  )
  values (
    owner_id,
    post_id_input,
    'post_updated',
    'Scheduled post canceled',
    'The scheduled post was canceled before the publishing worker claimed it.',
    jsonb_build_object('source', 'schedule_cancel')
  );

  return true;
end;
$$;

create index if not exists posts_user_future_schedule_idx
on public.posts (user_id, scheduled_at asc)
where status = 'scheduled' and scheduled_at is not null;

create index if not exists publish_jobs_worker_recovery_idx
on public.publish_jobs (locked_until, status)
where status in ('claimed', 'running');
