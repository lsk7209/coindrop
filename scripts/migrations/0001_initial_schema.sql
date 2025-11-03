-- CoinDrop.kr D1 Database Schema v1.01
-- Migration: 0001_initial_schema
-- Created: 2025-11-02

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  chains TEXT NOT NULL, -- JSON array
  website TEXT,
  twitter TEXT,
  discord TEXT,
  tvl_usd REAL,
  token_present INTEGER DEFAULT 0, -- BOOLEAN
  tokenless_confidence REAL DEFAULT 0.0 CHECK (tokenless_confidence >= 0 AND tokenless_confidence <= 1),
  created_at INTEGER NOT NULL, -- UTC timestamp (seconds)
  updated_at INTEGER NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 101
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_tokenless ON projects(token_present, tokenless_confidence);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

-- Airdrops table
CREATE TABLE IF NOT EXISTS airdrops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'ongoing', 'ended')),
  reward_type TEXT CHECK (reward_type IN ('token', 'nft', 'points', NULL)),
  snapshot_at INTEGER, -- UTC timestamp (seconds), nullable
  deadline_at INTEGER, -- UTC timestamp (seconds), nullable
  tasks_json TEXT, -- JSON array
  claim_links_json TEXT, -- JSON array
  source TEXT NOT NULL, -- e.g., 'defillama'
  source_ref TEXT, -- reference URL or ID
  new_flag INTEGER DEFAULT 1, -- BOOLEAN
  updated_at INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_airdrops_project ON airdrops(project_id);
CREATE INDEX IF NOT EXISTS idx_airdrops_status ON airdrops(status);
CREATE INDEX IF NOT EXISTS idx_airdrops_deadline ON airdrops(deadline_at) WHERE deadline_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airdrops_snapshot ON airdrops(snapshot_at) WHERE snapshot_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_airdrops_idempotency ON airdrops(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_airdrops_new ON airdrops(new_flag, updated_at DESC);

-- Contents table
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airdrop_id INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  hashtags TEXT NOT NULL, -- JSON array
  quality_scores TEXT NOT NULL, -- JSON: {seo, aeo, geneo}
  lint_errors TEXT, -- JSON array, nullable
  r2_key TEXT NOT NULL, -- R2 object key
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 101,
  FOREIGN KEY (airdrop_id) REFERENCES airdrops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug);
CREATE INDEX IF NOT EXISTS idx_contents_airdrop ON contents(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_contents_published ON contents(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_updated ON contents(updated_at DESC);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  interests TEXT NOT NULL DEFAULT '[]', -- JSON array
  is_active INTEGER DEFAULT 1, -- BOOLEAN
  last_sent_at INTEGER, -- UTC timestamp (seconds), nullable
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active, last_sent_at);

-- Posts log table
CREATE TABLE IF NOT EXISTS posts_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Twitter', 'Threads', 'Telegram')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  ext_post_id TEXT, -- External post ID from platform
  created_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  UNIQUE(content_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_posts_log_content ON posts_log(content_id);
CREATE INDEX IF NOT EXISTS idx_posts_log_platform ON posts_log(platform, status);
CREATE INDEX IF NOT EXISTS idx_posts_log_created ON posts_log(created_at DESC);

