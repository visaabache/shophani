-- Store schema. Prices are whole Moroccan dirhams (MAD).

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  desc_ar TEXT NOT NULL DEFAULT '',
  desc_fr TEXT NOT NULL DEFAULT '',
  desc_en TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  compare_price INTEGER,
  -- NULL means unlimited. The CHECK makes an order fail (and roll back) rather than oversell.
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  options TEXT NOT NULL DEFAULT '', -- comma-separated choices, e.g. sizes "S, M, L"
  images TEXT NOT NULL DEFAULT '[]', -- JSON array of image URLs
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX products_category ON products(category_id);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL, -- secret part of the customer's confirmation link
  status TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL,
  phone TEXT NOT NULL, -- international form, 2126XXXXXXXX
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'fr',
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX orders_status ON orders(status, id);
CREATE INDEX orders_phone ON orders(phone, created_at);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER, -- kept as a plain number so deleting a product keeps its past orders
  name TEXT NOT NULL,
  option TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0)
);
CREATE INDEX order_items_order ON order_items(order_id);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value) VALUES
  ('store_name', 'Shophani'),
  ('whatsapp', ''),
  ('contact_email', ''),
  ('shipping_fee', '35'),
  ('shipping_rates', '{"Casablanca": 20}'),
  ('free_shipping_over', '500'),
  ('announcement_ar', 'توصيل مجاني ابتداءً من 500 درهم · الدفع عند الاستلام'),
  ('announcement_fr', 'Livraison gratuite dès 500 DH · Paiement à la livraison'),
  ('announcement_en', 'Free delivery from MAD 500 · Cash on delivery');
