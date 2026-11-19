-- Counts recent attempts (admin logins, orders) per visitor so password guessing and order spam
-- can be slowed down. Visitors are stored as a hash of their IP address, never the address itself.
CREATE TABLE rate_hits (
  bucket TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX rate_hits_bucket_at ON rate_hits (bucket, at);
