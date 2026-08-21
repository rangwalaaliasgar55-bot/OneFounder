-- OneFounder cloud-ready schema
-- Apply this in Supabase SQL Editor when you want to move from local-first mode
-- to shared persistence with authenticated operators.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'OneFounder Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists ai_systems (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  purpose text not null,
  owner text not null,
  model_family text not null,
  deployment text not null,
  risk_level text not null,
  sensitivity text not null,
  human_review boolean not null default true,
  source_required boolean not null default true,
  pii_allowed boolean not null default false,
  status text not null default 'monitoring',
  incidents integer not null default 0,
  controls jsonb not null default '[]'::jsonb,
  last_audit timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  trigger text not null,
  owner text not null,
  status text not null,
  approval_mode text not null,
  sensitivity text not null,
  hours_saved_per_week numeric not null default 0,
  reliability numeric not null default 0,
  linked_metric text not null,
  fallback text not null,
  last_run timestamptz not null default now(),
  next_review timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  type text not null,
  target_id text not null,
  requested_by text not null,
  approver_role text not null,
  status text not null default 'pending',
  reason text not null,
  requested_action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor text not null,
  action text not null,
  target text not null,
  summary text not null,
  severity text not null,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  owner text not null,
  kind text not null,
  status text not null,
  summary text not null,
  citations jsonb not null default '[]'::jsonb,
  last_reviewed timestamptz not null default now(),
  freshness_score numeric not null default 0,
  usage_count integer not null default 0,
  sensitivity text not null,
  created_at timestamptz not null default now()
);

create table if not exists shadow_ai_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool_name text not null,
  team text not null,
  owner text not null,
  status text not null,
  risk_level text not null,
  last_seen timestamptz not null default now(),
  notes text not null default '',
  data_types jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_traces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  system_id text not null,
  title text not null,
  latency_ms integer not null default 0,
  token_cost_usd numeric not null default 0,
  quality_score numeric not null default 0,
  safety_score numeric not null default 0,
  outcome text not null,
  feedback text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  description text not null,
  owner text not null,
  due_at timestamptz not null,
  status text not null,
  linked_page text not null,
  created_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  template_id text not null,
  owner text not null,
  status text not null,
  summary text not null,
  steps jsonb not null default '[]'::jsonb,
  completed_steps integer not null default 0,
  next_action text not null,
  related_pages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  type text not null,
  enabled boolean not null default true,
  target text not null,
  last_tested timestamptz not null default now(),
  delivery_rate numeric not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists delivery_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel_id text not null,
  title text not null,
  summary text not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;
alter table team_members enable row level security;
alter table ai_systems enable row level security;
alter table automations enable row level security;
alter table approval_requests enable row level security;
alter table audit_events enable row level security;
alter table knowledge_sources enable row level security;
alter table shadow_ai_entries enable row level security;
alter table ai_traces enable row level security;
alter table reminders enable row level security;
alter table workflow_runs enable row level security;
alter table notification_channels enable row level security;
alter table delivery_events enable row level security;

-- Add your own auth-linked policies here.
