# Cloud Sync and Runtime Upgrade Notes

## What is now in the codebase

The app remains local-first for this sandbox session, but it now includes a cloud-ready structure for productionization:

- optional Supabase client wiring in `src/lib/supabase.ts`
- environment readiness detection in `src/lib/cloud.ts`
- a Supabase starter schema in `supabase/schema.sql`
- a cloud sync hook in `src/hooks/useWorkspaceCloudSync.ts`
- control-room visibility for cloud readiness and notification channels
- push/pull sync actions
- sync conflict detection and resolution paths
- multi-workspace local profile management that can map to workspace keys in cloud storage

## Required environment variables

Set these in a real deployment to enable cloud-ready configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Why this matters

In the modern AI operating model, serious teams need more than a browser demo:

- shared persistence
- real identities
- role-aware approvals
- audit history that survives devices
- notification delivery beyond the current session
- governed source-of-truth updates

This codebase now has the architecture direction and schema surface for that next step.

## Recommended next production step

1. Create the Supabase project.
2. Apply `supabase/schema.sql`.
3. Add authenticated user mapping to `team_members`.
4. Replace local-first persistence with hybrid local cache + cloud sync.
5. Route approval requests, audit events, reminders, and traces to shared tables.
6. Add row-level security policies per workspace.
7. Add real email/Slack delivery services on top of `notification_channels` and `delivery_events`.
