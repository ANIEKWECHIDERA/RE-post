-- Phase 7 publish job claiming.
-- This function is intended for service-role server code. It uses row locks so
-- multiple workers can poll safely without claiming the same queued job.

create or replace function public.claim_publish_jobs(
  worker_id_input text,
  limit_input integer default 5,
  lock_seconds_input integer default 300
)
returns setof public.publish_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimable as (
    select id
    from public.publish_jobs
    where status in ('queued', 'failed')
      and run_at <= now()
      and (locked_until is null or locked_until < now())
      and attempts_count < max_attempts
    order by run_at asc, created_at asc
    for update skip locked
    limit greatest(limit_input, 1)
  )
  update public.publish_jobs jobs
  set
    status = 'claimed',
    claimed_at = now(),
    locked_until = now() + make_interval(secs => greatest(lock_seconds_input, 30)),
    worker_id = worker_id_input,
    attempts_count = jobs.attempts_count + 1,
    updated_at = now()
  from claimable
  where jobs.id = claimable.id
  returning jobs.*;
end;
$$;
