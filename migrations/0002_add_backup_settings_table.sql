-- Add backup settings storage for Google Drive backup and restore
-- This table stores per-school Drive OAuth metadata and backup timestamps.

CREATE TABLE IF NOT EXISTS school_backup_settings (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  google_drive_connected INTEGER NOT NULL DEFAULT 0,
  google_drive_folder_id TEXT,
  google_drive_token TEXT,
  google_drive_refresh_token TEXT,
  google_drive_token_expires_at TEXT,
  last_backup_at TEXT,
  last_restore_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_backup_settings_school_id ON school_backup_settings(school_id);
