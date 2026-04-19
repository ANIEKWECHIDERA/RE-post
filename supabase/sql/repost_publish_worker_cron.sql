-- RE-post publish worker cron installation runbook.
-- Fill the placeholders in a private SQL editor session after the Next.js app
-- is deployed and the publish-worker Edge Function secrets are set.
--
-- Required Edge Function secrets:
--   PUBLISH_WORKER_URL=https://<your-next-app-domain>/api/publish/run
--   PUBLISH_WORKER_SECRET=<same value as the Next.js app env>
--
-- Required Vault secrets for Postgres cron -> Edge Function auth:
--   repost_publish_worker_function_url
--   repost_publish_worker_function_jwt

select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/publish-worker',
  'repost_publish_worker_function_url',
  'RE-post publish-worker Edge Function URL'
);

select vault.create_secret(
  '<supabase-anon-or-publishable-key>',
  'repost_publish_worker_function_jwt',
  'Bearer token used by pg_cron to invoke the JWT-protected publish-worker Edge Function'
);

select cron.schedule(
  'repost-publish-worker-every-minute',
  '* * * * *',
  $$ select public.invoke_publish_worker_cron(10); $$
);

-- Inspect recent cron runs:
-- select *
-- from cron.job_run_details
-- where jobid = (
--   select jobid
--   from cron.job
--   where jobname = 'repost-publish-worker-every-minute'
-- )
-- order by start_time desc
-- limit 10;

-- Inspect pg_net HTTP responses:
-- select *
-- from net._http_response
-- order by created desc
-- limit 10;

-- Disable without deleting history:
-- select cron.alter_job(
--   job_id := (
--     select jobid
--     from cron.job
--     where jobname = 'repost-publish-worker-every-minute'
--   ),
--   active := false
-- );

-- Remove the cron job:
-- select cron.unschedule('repost-publish-worker-every-minute');
