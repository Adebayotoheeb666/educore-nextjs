-- Seed the Backup & Recovery service into the services catalog for existing databases.

INSERT OR REPLACE INTO services (
  id, name, slug, description, is_compulsory, base_price, billing_period,
  dependencies, category, is_active, version, created_at, updated_at
)
VALUES (
  'svc_backup',
  'Backup & Recovery',
  'backup',
  'Google Drive backup, manual restore, and scheduled recovery for school data',
  0,
  0,
  'monthly',
  '["school"]',
  'backup',
  1,
  '1.0.0',
  datetime('now'),
  datetime('now')
);
