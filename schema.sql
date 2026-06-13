-- OneFounder — Full Database Schema for Neon PostgreSQL
-- Paste this entire file into your Neon SQL Editor and run it.
-- Safe to re-run: all statements use IF NOT EXISTS / DO NOTHING patterns.

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE idea_status AS ENUM ('draft', 'validated', 'building', 'launched');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('blog', 'landing_page', 'linkedin', 'twitter', 'newsletter', 'email', 'ad_copy', 'product_description');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE social_post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE social_platform AS ENUM ('linkedin', 'twitter', 'instagram', 'tiktok', 'facebook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance_entry_type AS ENUM ('revenue', 'expense', 'subscription');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Auth Tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  name              TEXT,
  avatar            TEXT,
  image             TEXT,
  email_verified    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMP NOT NULL,
  token        TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  ip_address   TEXT,
  user_agent   TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id                         TEXT PRIMARY KEY,
  user_id                    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id                 TEXT NOT NULL,
  provider_id                TEXT NOT NULL,
  access_token               TEXT,
  refresh_token              TEXT,
  id_token                   TEXT,
  access_token_expires_at    TIMESTAMP,
  refresh_token_expires_at   TIMESTAMP,
  scope                      TEXT,
  expires_at                 TIMESTAMP,
  password                   TEXT,
  created_at                 TIMESTAMP DEFAULT NOW(),
  updated_at                 TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verifications (
  id           TEXT PRIMARY KEY,
  identifier   TEXT NOT NULL,
  value        TEXT NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Core Business Tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_ideas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT,
  status            idea_status DEFAULT 'draft',
  competition       TEXT,
  revenue_potential TEXT,
  market_size       TEXT,
  difficulty        TEXT,
  roadmap           JSONB,
  metadata          JSONB,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id       UUID REFERENCES business_ideas(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  niche         TEXT,
  competitors   JSONB,
  swot          JSONB,
  trends        JSONB,
  opportunities JSONB,
  keywords      JSONB,
  risks         JSONB,
  full_report   TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id                UUID REFERENCES business_ideas(id) ON DELETE SET NULL,
  title                  TEXT NOT NULL,
  business_model         TEXT,
  pricing                JSONB,
  customer_profile       TEXT,
  acquisition_strategy   TEXT,
  launch_strategy        TEXT,
  growth_strategy        TEXT,
  financial_projections  JSONB,
  full_plan              TEXT,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id     UUID REFERENCES business_ideas(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'active',
  color       TEXT DEFAULT '#6366f1',
  emoji       TEXT DEFAULT '🚀',
  due_date    TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending',
  due_date     TIMESTAMP,
  completed_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       task_status DEFAULT 'todo',
  priority     TEXT DEFAULT 'medium',
  due_date     TIMESTAMP,
  completed_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_pieces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  type         content_type DEFAULT 'blog',
  content      TEXT,
  prompt       TEXT,
  status       TEXT DEFAULT 'draft',
  tags         JSONB,
  metadata     JSONB,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  company    TEXT,
  phone      TEXT,
  status     lead_status DEFAULT 'lead',
  source     TEXT,
  notes      TEXT,
  value      INTEGER,
  metadata   JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  model      TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  type       TEXT DEFAULT 'note',
  tags       JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform     social_platform NOT NULL,
  content      TEXT NOT NULL,
  status       social_post_status DEFAULT 'draft',
  hashtags     JSONB,
  media_urls   JSONB,
  metrics      JSONB,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type               finance_entry_type NOT NULL,
  amount             INTEGER NOT NULL,
  currency           TEXT DEFAULT 'USD',
  description        TEXT NOT NULL,
  category           TEXT,
  recurring          BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT,
  date               TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ─── SEO Tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_keywords (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword      TEXT NOT NULL,
  target_url   TEXT,
  volume       INTEGER,
  difficulty   INTEGER,
  current_rank INTEGER,
  target_rank  INTEGER,
  intent       TEXT,
  cluster      TEXT,
  priority     TEXT DEFAULT 'medium',
  status       TEXT DEFAULT 'tracking',
  rank_history JSONB DEFAULT '[]',
  notes        TEXT,
  tags         JSONB,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  score           INTEGER,
  issues          JSONB,
  recommendations JSONB,
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backlinks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url       TEXT NOT NULL,
  source_domain    TEXT,
  target_url       TEXT NOT NULL,
  anchor_text      TEXT,
  type             TEXT DEFAULT 'dofollow',
  status           TEXT DEFAULT 'active',
  domain_authority INTEGER,
  category         TEXT,
  notes            TEXT,
  discovered_at    TIMESTAMP DEFAULT NOW(),
  lost_at          TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_briefs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword          TEXT NOT NULL,
  target_audience  TEXT,
  business_context TEXT,
  titles           JSONB,
  meta_description TEXT,
  outline          JSONB,
  word_count       INTEGER,
  key_points       JSONB,
  related_keywords JSONB,
  faq_section      JSONB,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ─── WordPress / Integrations ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wp_sites (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_url             TEXT NOT NULL,
  site_name            TEXT,
  application_password TEXT,
  username             TEXT,
  status               TEXT DEFAULT 'active',
  metadata             JSONB,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- ─── Founder / AI Tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS founder_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  risk_tolerance TEXT DEFAULT 'moderate',
  work_style     TEXT DEFAULT 'builder',
  primary_goal   TEXT DEFAULT 'get_first_customer',
  bio            TEXT,
  industry       TEXT,
  stage          TEXT DEFAULT 'idea',
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  content             TEXT NOT NULL,
  source              TEXT,
  importance          INTEGER DEFAULT 5,
  tags                JSONB DEFAULT '[]',
  expires_at          TIMESTAMP,
  last_referenced_at  TIMESTAMP DEFAULT NOW(),
  reference_count     INTEGER DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  module     TEXT NOT NULL,
  entity_id  TEXT,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  module     TEXT,
  priority   TEXT DEFAULT 'medium',
  read       BOOLEAN DEFAULT FALSE,
  dismissed  BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  stage        TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  icon         TEXT DEFAULT '🚀',
  xp           INTEGER DEFAULT 100,
  "order"      INTEGER NOT NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Indexes (performance) ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id        ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id        ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_ideas_user_id  ON business_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id           ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id        ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id           ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id   ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session   ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_user_id ON finance_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_user_id    ON seo_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id    ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id     ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id     ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id    ON user_activity_log(user_id);
