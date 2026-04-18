import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve("supabase/migrations/202604180001_repost_v2_phase2_schema.sql");
const realtimeMigrationPath = resolve("supabase/migrations/202604180002_repost_v2_phase4_realtime.sql");
const sql = readFileSync(migrationPath, "utf8");
const realtimeSql = readFileSync(realtimeMigrationPath, "utf8");

const requiredTables = [
  "profiles",
  "social_connections",
  "media_assets",
  "media_variants",
  "posts",
  "post_media_assets",
  "post_platform_targets",
  "publish_jobs",
  "publish_attempts",
  "activity_events",
  "streak_state",
  "streak_events",
  "analytics_daily_rollups",
];

const requiredEnums = [
  "social_platform",
  "social_connection_status",
  "media_kind",
  "media_asset_status",
  "post_status",
  "schedule_mode",
  "post_target_status",
  "publish_job_status",
  "publish_attempt_status",
  "activity_event_type",
  "streak_event_type",
];

const missing = [];

for (const table of requiredTables) {
  if (!sql.includes(`create table public.${table}`)) {
    missing.push(`table:${table}`);
  }

  if (!sql.includes(`alter table public.${table} enable row level security`)) {
    missing.push(`rls:${table}`);
  }
}

for (const enumName of requiredEnums) {
  if (!sql.includes(`create type public.${enumName}`)) {
    missing.push(`enum:${enumName}`);
  }
}

const storagePolicies = [
  "post_media_objects_select_own",
  "post_media_objects_insert_own",
  "post_media_objects_update_own",
  "post_media_objects_delete_own",
];

for (const policy of storagePolicies) {
  if (!sql.includes(`create policy "${policy}" on storage.objects`)) {
    missing.push(`storage-policy:${policy}`);
  }
}

if (!sql.includes("insert into storage.buckets")) {
  missing.push("storage-bucket:post-media");
}

if (!sql.includes("create trigger on_auth_user_created")) {
  missing.push("trigger:on_auth_user_created");
}

for (const realtimeTable of [
  "activity_events",
  "streak_state",
  "post_platform_targets",
  "posts",
  "social_connections",
]) {
  if (!realtimeSql.includes(`alter publication supabase_realtime add table public.${realtimeTable}`)) {
    missing.push(`realtime:${realtimeTable}`);
  }
}

if (missing.length > 0) {
  console.error("Phase 2 schema verification failed.");
  console.error(missing.join("\n"));
  process.exit(1);
}

console.log("Phase 2 schema verification passed.");
