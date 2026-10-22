-- Product photos uploaded from the admin, stored in D1 so no R2 bucket (and no payment card) is needed.
-- The admin shrinks each photo in the browser first, so rows stay well under D1's 2 MB limit.
CREATE TABLE images (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data BLOB NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
