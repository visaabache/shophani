-- Photos and videos shown in a product's description, as a JSON array of {"type": "image"|"video", "url": "/img/..."}.
ALTER TABLE products ADD COLUMN desc_media TEXT NOT NULL DEFAULT '[]';

-- Videos are too big for one D1 value (2 MB max), so they are stored in pieces of 1.5 MB.
-- The images table keeps the video's key, type and total size (with an empty data column).
CREATE TABLE media_chunks (
  key TEXT NOT NULL,
  idx INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (key, idx)
);
