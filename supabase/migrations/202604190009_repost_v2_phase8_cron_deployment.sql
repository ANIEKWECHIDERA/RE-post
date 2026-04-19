-- Navigation expansion Phase 8: deployable cron invocation helper.
-- Supabase Cron runs inside Postgres, so secrets used by cron must live in
-- Vault rather than app env files. This helper reads only the Edge Function URL
-- and JWT needed to invoke the Supabase function; the Edge Function keeps the
-- Next.js worker URL/secret in Edge Function secrets.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.invoke_publish_worker_cron(limit_input integer default 10)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  function_url text;
  function_jwt text;
  request_id bigint;
begin
  select decrypted_secret
  into function_url
  from vault.decrypted_secrets
  where name = 'repost_publish_worker_function_url'
  limit 1;

  select decrypted_secret
  into function_jwt
  from vault.decrypted_secrets
  where name = 'repost_publish_worker_function_jwt'
  limit 1;

  if function_url is null or function_jwt is null then
    raise exception
      'Missing Vault secrets: repost_publish_worker_function_url and repost_publish_worker_function_jwt are required.';
  end if;

  select net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || function_jwt
    ),
    body := jsonb_build_object(
      'limit', least(25, greatest(1, coalesce(limit_input, 10)))
    ),
    timeout_milliseconds := 10000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_publish_worker_cron(integer) from public;
revoke all on function public.invoke_publish_worker_cron(integer) from anon;
revoke all on function public.invoke_publish_worker_cron(integer) from authenticated;

comment on function public.invoke_publish_worker_cron(integer) is
  'Cron-only helper that invokes the publish-worker Edge Function via pg_net using URL/JWT stored in Supabase Vault.';
