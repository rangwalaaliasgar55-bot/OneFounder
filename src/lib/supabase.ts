import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

/*
-- Run in Supabase SQL editor

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  company text,
  value numeric default 0,
  stage text default 'lead',
  source text,
  notes text,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assignee text,
  due_date date,
  priority text default 'medium',
  status text default 'todo',
  description text,
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  type text not null,
  category text,
  date date default current_date,
  created_at timestamptz default now()
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  score integer default 50,
  category text,
  tags text[],
  market text,
  created_at timestamptz default now()
);
*/
