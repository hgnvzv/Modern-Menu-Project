-- Staff accounts with roles.
--
-- Before this migration the panel had exactly one administrator, kept in the
-- `settings` key/value table (admin_username + admin_password_hash). That
-- account is copied below as a "manager" so nobody is locked out.
--
-- Roles:
--   manager — full access to every admin endpoint
--   waiter  — reads and handles incoming service requests only

CREATE TABLE IF NOT EXISTS staff_users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('manager', 'waiter')),
  display_name  TEXT,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_username ON staff_users(username);

-- Carry the legacy single-admin account over (only when one exists).
INSERT OR IGNORE INTO staff_users (id, username, password_hash, role, display_name, created_at)
SELECT lower(hex(randomblob(16))),
       COALESCE((SELECT value FROM settings WHERE key = 'admin_username'), 'admin'),
       s.value,
       'manager',
       'المدير',
       CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM settings s
WHERE s.key = 'admin_password_hash';
