# RE-post v2 Phase 12 - QA, Hardening, And Cleanup

Date: 2026-04-19

## Goal

Harden the app after the foundation phases: clean stale copy, verify security posture, apply database performance fixes, confirm the build, and document setup/limitations clearly.

## What Was Implemented

- Added `npm run dev:all` as the single root command for the Next.js frontend and backend route handlers.
- Added `docs/SETUP.md` with environment, run, verify, migration, worker, and limitation notes.
- Added `supabase/migrations/202604190007_repost_v2_phase12_hardening.sql`.
- Applied the Phase 12 hardening migration remotely through Supabase MCP.
- Added indexes for foreign keys reported by Supabase performance advisors.
- Updated schema verification to check the Phase 12 hardening indexes.
- Replaced stale phase labels in user-facing UI copy.
- Removed stale migration-phase wording from runtime error messages.
- Fixed the app shell's hardcoded date.
- Added `aria-current` to the active sidebar item.
- Updated `/api/health` to report `phase: 12`.

## Supabase Advisor Review

Security:

- Remaining warning: `extension_in_public` for `citext`.
- This is documented as a future compatibility migration because dependent columns already use `citext`.

Performance:

- Added covering indexes for unindexed foreign keys reported by advisors.
- Rechecked advisors after the migration; unindexed foreign-key notices are gone.
- Unused-index notices remain because the database is empty; usage stats are not meaningful yet.

## Remote Migration Status

Remote migrations applied through Supabase MCP:

- `repost_v2_phase2_schema`
- `repost_v2_phase4_realtime`
- `repost_v2_phase6_connection_oauth_states`
- `repost_v2_phase7_publish_claiming`
- `repost_v2_phase8_scheduling`
- `repost_v2_phase9_streak_engine`
- `repost_v2_phase12_hardening`

All public app tables have RLS enabled.

## Tests And Checks

Passed:

```bash
npm run verify:schema
npm run check
npm run build
npm audit --audit-level=high
```

Remote checks:

- Supabase migrations listed successfully.
- Supabase table list confirms RLS enabled on app tables.
- Supabase security/performance advisors reviewed.

## Production-Ready vs Still Scaffolded

Production-minded foundation:

- Auth-protected app shell
- Supabase schema, RLS, storage policy foundation
- Media validation and upload path
- Scheduled queue with cancellation
- Backend-controlled publish engine and worker route
- Streak engine
- Realtime dashboard activity
- Basic analytics scaffold
- Remote migrations applied

Still scaffolded:

- Real OAuth callback/token exchange
- Real provider publishing
- Supabase cron deployment
- Provider-native analytics
- Analytics rollup worker
- Full activity history page
- End-to-end user-flow tests with real accounts

## Recommended Next Work

The next implementation pass should prioritize:

- provider OAuth callbacks
- active encrypted token persistence
- real LinkedIn/Facebook/Instagram adapter calls
- Supabase cron deployment for the publish worker
- end-to-end tests using a real Supabase auth user
