-- Phase 2 ownership smoke test.
-- Run after applying migrations to a local Supabase database.
-- This file is intentionally plain SQL so it can run from psql or Supabase SQL editor.

begin;

-- Supabase local databases allow privileged inserts into auth.users for tests.
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'phase2-a@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Phase Two A","timezone":"UTC"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'phase2-b@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Phase Two B","timezone":"UTC"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';
set local request.jwt.claim.role = 'authenticated';

insert into public.posts (id, user_id, body, status)
values (
  '10000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  'Phase 2 ownership smoke test',
  'draft'
);

do $$
begin
  if not exists (
    select 1 from public.posts
    where id = '10000000-0000-0000-0000-000000000101'
  ) then
    raise exception 'owner should be able to read their own post';
  end if;
end;
$$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000202';
set local request.jwt.claim.role = 'authenticated';

do $$
begin
  if exists (
    select 1 from public.posts
    where id = '10000000-0000-0000-0000-000000000101'
  ) then
    raise exception 'different user should not be able to read another user post';
  end if;
end;
$$;

rollback;
