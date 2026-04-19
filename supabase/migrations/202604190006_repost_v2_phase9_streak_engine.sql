-- Phase 9 streak engine.
-- One successful publish day counts once per creator timezone, regardless of
-- how many platforms succeeded for the same post.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.record_publish_streak_success(
  user_id_input uuid,
  post_id_input uuid,
  occurred_at_input timestamptz default now()
)
returns public.streak_state
language plpgsql
security definer
set search_path = public
as $$
declare
  current_state public.streak_state%rowtype;
  next_state public.streak_state%rowtype;
  creator_timezone text;
  event_day date;
  previous_count integer;
  next_count integer;
  event_type public.streak_event_type;
begin
  select coalesce(s.timezone, p.timezone, 'UTC')
  into creator_timezone
  from public.profiles p
  left join public.streak_state s on s.user_id = p.id
  where p.id = user_id_input;

  creator_timezone := coalesce(creator_timezone, 'UTC');
  event_day := (occurred_at_input at time zone creator_timezone)::date;

  insert into public.streak_state (user_id, timezone)
  values (user_id_input, creator_timezone)
  on conflict (user_id) do nothing;

  select *
  into current_state
  from public.streak_state
  where user_id = user_id_input
  for update;

  if current_state.last_successful_post_id = post_id_input then
    return current_state;
  end if;

  previous_count := current_state.current_count;

  if current_state.last_counted_on = event_day then
    next_count := greatest(current_state.current_count, 1);
    event_type := 'maintained';
  elsif current_state.last_counted_on = event_day - 1 then
    next_count := current_state.current_count + 1;
    event_type := 'incremented';
  elsif current_state.last_counted_on is null then
    next_count := 1;
    event_type := 'incremented';
  else
    next_count := 1;
    event_type := 'reset';
  end if;

  update public.streak_state
  set
    timezone = creator_timezone,
    current_count = next_count,
    longest_count = greatest(current_state.longest_count, next_count),
    last_counted_on = event_day,
    last_successful_post_id = post_id_input,
    updated_at = now()
  where user_id = user_id_input
  returning *
  into next_state;

  insert into public.streak_events (
    user_id,
    post_id,
    event_date,
    type,
    previous_count,
    new_count,
    metadata
  )
  values (
    user_id_input,
    post_id_input,
    event_day,
    event_type,
    previous_count,
    next_count,
    jsonb_build_object(
      'timezone', creator_timezone,
      'occurredAt', occurred_at_input,
      'rule', 'one_successful_post_per_creator_day'
    )
  )
  on conflict (user_id, event_date, type) do nothing;

  insert into public.activity_events (
    user_id,
    post_id,
    type,
    title,
    message,
    metadata
  )
  values (
    user_id_input,
    post_id_input,
    'streak_updated',
    case
      when event_type = 'maintained' then 'Streak protected'
      when event_type = 'reset' then 'Streak restarted'
      else 'Streak updated'
    end,
    case
      when event_type = 'maintained' then 'Today already counted. Keep the rhythm warm.'
      when event_type = 'reset' then 'A new streak starts today.'
      else 'Your daily posting streak moved forward.'
    end,
    jsonb_build_object(
      'eventDate', event_day,
      'previousCount', previous_count,
      'newCount', next_count,
      'timezone', creator_timezone,
      'eventType', event_type
    )
  );

  return next_state;
end;
$$;

create index if not exists streak_state_last_counted_idx
on public.streak_state (user_id, last_counted_on);
