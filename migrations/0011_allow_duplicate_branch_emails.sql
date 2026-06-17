-- Migration: Allow branches under the same owner to share the same email
-- Rebuild the `schools` table without the global UNIQUE constraint on `email`
BEGIN;

CREATE TABLE IF NOT EXISTS schools_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  type TEXT,
  owner_id TEXT,
  sub_domain TEXT UNIQUE,
  address TEXT,
  logo TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK(subscription_status IN ('active', 'inactive', 'trial')),
  subscription_plan TEXT NOT NULL DEFAULT 'basic',
  ai_token_budget INTEGER NOT NULL DEFAULT 100000,
  used_ai_tokens INTEGER NOT NULL DEFAULT 0,
  subscription_expires_at TEXT,
  subscription_last_paid_at TEXT,
  billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')),
  academic_session TEXT NOT NULL DEFAULT '2024/2025',
  current_term TEXT NOT NULL DEFAULT 'first' CHECK(current_term IN ('first', 'second', 'third')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy existing data into the new table
INSERT INTO schools_new (
  id, name, email, phone, state, type, owner_id, sub_domain, address, logo,
  subscription_status, subscription_plan, ai_token_budget, used_ai_tokens,
  subscription_expires_at, subscription_last_paid_at, billing_cycle,
  academic_session, current_term, created_at, updated_at
)
SELECT
  id, name, email, phone, state, type, owner_id, sub_domain, address, logo,
  subscription_status, subscription_plan, ai_token_budget, used_ai_tokens,
  subscription_expires_at, subscription_last_paid_at, billing_cycle,
  academic_session, current_term, created_at, updated_at
FROM schools;

-- Replace old table
DROP TABLE IF EXISTS schools;
ALTER TABLE schools_new RENAME TO schools;

-- Create composite unique index so an owner cannot have duplicate branch records
-- with the same email, but different owners may reuse emails.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_owner_email ON schools(owner_id, email);

COMMIT;

-- Notes:
-- If this migration fails because of duplicate (owner_id, email) pairs, resolve
-- the duplicates first (e.g., merge or null emails) before re-running.
