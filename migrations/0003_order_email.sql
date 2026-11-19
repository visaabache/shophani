-- Optional customer email on orders, and the settings for order emails.
ALTER TABLE orders ADD COLUMN email TEXT NOT NULL DEFAULT '';
INSERT OR IGNORE INTO settings (key, value) VALUES ('email_from', ''), ('notify_email', ''), ('email_status_updates', '1');
