// Admin API (/api/admin/*), used by public/admin/. Protected by the ADMIN_PASSWORD secret:
// logging in sets a signed, HttpOnly session cookie that lasts 7 days.

import { json, getSettings, slugify, STATUSES, RESTOCK_STATUSES, randomToken, parseJSON, displayPhone } from './lib.js';

const SESSION_DAYS = 7;
const COOKIE = 'admin_session';
const SETTING_KEYS = [
  'store_name', 'whatsapp', 'contact_email', 'shipping_fee', 'shipping_rates', 'free_shipping_over',
  'announcement_ar', 'announcement_fr', 'announcement_en',
  'hero_title_ar', 'hero_title_fr', 'hero_title_en', 'hero_text_ar', 'hero_text_fr', 'hero_text_en',
];

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(`admin-session:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function makeSession(secret) {
  const payload = `${Date.now() + SESSION_DAYS * 864e5}.${randomToken(8)}`;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${b64(sig)}`;
}

async function validSession(cookieValue, secret) {
  const parts = String(cookieValue || '').split('.');
  if (parts.length !== 3 || Number(parts[0]) < Date.now()) return false;
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}

async function samePassword(a, b) {
  // Compare digests so the comparison takes the same time whatever the input.
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const ax = new Uint8Array(x);
  const ay = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ ay[i];
  return diff === 0;
}

function getCookie(request, name) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : '';
}

async function body(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const int = (v, fallback = null) => (v === '' || v == null || Number.isNaN(Number(v)) ? fallback : Math.round(Number(v)));

export async function handleAdmin(request, env, url) {
  const path = url.pathname.slice('/api/admin'.length);
  const method = request.method;
  const secret = env.ADMIN_PASSWORD;
  if (!secret) return json({ error: 'ADMIN_PASSWORD is not set. Run: npx wrangler secret put ADMIN_PASSWORD' }, 503);

  if (path === '/login' && method === 'POST') {
    const b = await body(request);
    if (!b || !(await samePassword(String(b.password || ''), secret))) {
      await new Promise((r) => setTimeout(r, 800));
      return json({ error: 'wrong_password' }, 401);
    }
    const token = await makeSession(secret);
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}` });
  }
  if (path === '/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }
  if (!(await validSession(getCookie(request, COOKIE), secret))) return json({ error: 'unauthorized' }, 401);
  // Writes must be JSON (or an image upload), which a cross-site form cannot send; the cookie is SameSite=Strict too.
  if (method !== 'GET' && path !== '/images' && !(request.headers.get('content-type') || '').includes('application/json')) {
    return json({ error: 'bad_request' }, 400);
  }

  const db = env.DB;
  let m;

  if (path === '/me') return json({ ok: true, images: Boolean(env.IMAGES) });

  if (path === '/stats' && method === 'GET') {
    const row = await db
      .prepare(
        `SELECT
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_orders,
          SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today,
          SUM(CASE WHEN status = 'delivered' AND created_at > datetime('now', '-30 days') THEN total ELSE 0 END) AS revenue_30d,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) AS orders_30d,
          SUM(CASE WHEN status IN ('cancelled', 'returned') AND created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) AS failed_30d
        FROM orders`,
      )
      .first();
    const low = await db.prepare('SELECT id, name_fr, stock FROM products WHERE active = 1 AND stock IS NOT NULL AND stock <= 3 ORDER BY stock LIMIT 10').all();
    return json({ ...row, low_stock: low.results });
  }

  // Orders
  if (path === '/orders' && method === 'GET') {
    const status = url.searchParams.get('status');
    const q = (url.searchParams.get('q') || '').trim();
    const page = Math.max(1, int(url.searchParams.get('page'), 1));
    const where = [];
    const args = [];
    if (STATUSES.includes(status)) {
      where.push('status = ?');
      args.push(status);
    }
    if (q) {
      where.push('(number LIKE ? OR name LIKE ? OR phone LIKE ? OR city LIKE ?)');
      const like = `%${q}%`;
      args.push(like, like, `%${q.replace(/\D/g, '').replace(/^0/, '') || q}%`, like);
    }
    const sql = `SELECT id, number, status, name, phone, city, total, created_at FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 50 OFFSET ?`;
    const rows = await db.prepare(sql).bind(...args, (page - 1) * 50).all();
    return json({ orders: rows.results.map((o) => ({ ...o, phone_display: displayPhone(o.phone) })), page });
  }

  if (path === '/orders.csv' && method === 'GET') {
    const status = url.searchParams.get('status');
    const rows = await db
      .prepare(`SELECT o.*, (SELECT group_concat(name || CASE WHEN option != '' THEN ' (' || option || ')' ELSE '' END || ' x' || qty, ' + ') FROM order_items WHERE order_id = o.id) AS items FROM orders o ${STATUSES.includes(status) ? 'WHERE status = ?' : ''} ORDER BY id DESC LIMIT 5000`)
      .bind(...(STATUSES.includes(status) ? [status] : []))
      .all();
    const cols = ['number', 'created_at', 'status', 'name', 'phone', 'city', 'address', 'items', 'subtotal', 'shipping', 'total', 'note', 'admin_note'];
    const cell = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // stop spreadsheets from running a cell as a formula
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '﻿' + [cols.join(';'), ...rows.results.map((r) => cols.map((c) => cell(c === 'phone' ? displayPhone(r.phone) : r[c])).join(';'))].join('\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="commandes-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }

  if ((m = path.match(/^\/orders\/(\d+)$/))) {
    const id = Number(m[1]);
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    if (!order) return json({ error: 'not_found' }, 404);
    if (method === 'GET') {
      const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(id).all();
      return json({ order: { ...order, phone_display: displayPhone(order.phone) }, items: items.results });
    }
    if (method === 'PATCH') {
      const b = await body(request);
      if (!b) return json({ error: 'bad_request' }, 400);
      const statements = [];
      const next = b.status ?? order.status;
      if (!STATUSES.includes(next)) return json({ error: 'bad_status' }, 400);
      const wasOut = RESTOCK_STATUSES.includes(order.status);
      const isOut = RESTOCK_STATUSES.includes(next);
      if (wasOut !== isOut) {
        // Cancelling or returning puts the items back in stock; reopening takes them out again.
        const items = await db.prepare('SELECT product_id, qty FROM order_items WHERE order_id = ?').bind(id).all();
        for (const it of items.results) {
          if (it.product_id) statements.push(db.prepare('UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL').bind(isOut ? it.qty : -it.qty, it.product_id));
        }
      }
      statements.push(
        db.prepare("UPDATE orders SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?").bind(next, b.admin_note != null ? String(b.admin_note).slice(0, 1000) : order.admin_note, id),
      );
      try {
        await db.batch(statements);
      } catch (err) {
        if (String(err).includes('CHECK')) return json({ error: 'not_enough_stock' }, 409);
        throw err;
      }
      return json({ ok: true });
    }
  }

  // Products
  if (path === '/products' && method === 'GET') {
    const rows = await db.prepare('SELECT * FROM products ORDER BY sort, id DESC').all();
    return json({ products: rows.results });
  }
  if (path === '/products' && method === 'POST') return saveProduct(db, null, await body(request));
  if ((m = path.match(/^\/products\/(\d+)$/))) {
    const id = Number(m[1]);
    if (method === 'PUT') return saveProduct(db, id, await body(request));
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  // Categories
  if (path === '/categories' && method === 'GET') {
    const rows = await db.prepare('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products FROM categories c ORDER BY sort, id').all();
    return json({ categories: rows.results });
  }
  if (path === '/categories' && method === 'POST') return saveCategory(db, null, await body(request));
  if ((m = path.match(/^\/categories\/(\d+)$/))) {
    const id = Number(m[1]);
    if (method === 'PUT') return saveCategory(db, id, await body(request));
    if (method === 'DELETE') {
      await db.batch([db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').bind(id), db.prepare('DELETE FROM categories WHERE id = ?').bind(id)]);
      return json({ ok: true });
    }
  }

  // Settings
  if (path === '/settings' && method === 'GET') return json({ settings: await getSettings(db) });
  if (path === '/settings' && method === 'PUT') {
    const b = await body(request);
    if (!b) return json({ error: 'bad_request' }, 400);
    if (b.shipping_rates != null && typeof parseJSON(b.shipping_rates, null) !== 'object') return json({ error: 'bad_shipping_rates' }, 400);
    const statements = SETTING_KEYS.filter((k) => k in b).map((k) =>
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(k, String(b[k] ?? '').slice(0, 2000)),
    );
    if (statements.length) await db.batch(statements);
    return json({ ok: true });
  }

  // Image upload: raw file body → R2 → /img/<key>
  if (path === '/images' && method === 'POST') {
    if (!env.IMAGES) return json({ error: 'no_r2' }, 503);
    const type = (request.headers.get('content-type') || '').split(';')[0];
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[type];
    if (!ext) return json({ error: 'bad_type' }, 415);
    const data = await request.arrayBuffer();
    if (data.byteLength > 5 * 1024 * 1024) return json({ error: 'too_large' }, 413);
    const key = `p/${Date.now().toString(36)}-${randomToken(6)}.${ext}`;
    await env.IMAGES.put(key, data, { httpMetadata: { contentType: type } });
    return json({ url: `/img/${key}` }, 201);
  }

  return json({ error: 'not_found' }, 404);
}

async function saveProduct(db, id, b) {
  if (!b) return json({ error: 'bad_request' }, 400);
  const names = { ar: String(b.name_ar || '').trim(), fr: String(b.name_fr || '').trim(), en: String(b.name_en || '').trim() };
  if (!names.fr && !names.ar && !names.en) return json({ error: 'name_required' }, 422);
  const price = int(b.price);
  if (price == null || price < 0) return json({ error: 'price_required' }, 422);
  const slug = slugify(b.slug || names.fr || names.en) || `produit-${Date.now().toString(36)}`;
  const images = (Array.isArray(b.images) ? b.images : String(b.images || '').split('\n'))
    .map((s) => String(s).trim())
    .filter((s) => s.startsWith('/') || s.startsWith('https://'))
    .slice(0, 10);
  const stock = int(b.stock);
  const values = [
    slug, int(b.category_id), names.ar, names.fr, names.en,
    String(b.desc_ar || ''), String(b.desc_fr || ''), String(b.desc_en || ''),
    price, int(b.compare_price), stock == null ? null : Math.max(0, stock),
    String(b.options || '').split(',').map((s) => s.trim()).filter(Boolean).join(', '),
    JSON.stringify(images), b.featured ? 1 : 0, b.active === false || b.active === 0 ? 0 : 1, int(b.sort, 0),
  ];
  try {
    if (id) {
      await db
        .prepare('UPDATE products SET slug=?, category_id=?, name_ar=?, name_fr=?, name_en=?, desc_ar=?, desc_fr=?, desc_en=?, price=?, compare_price=?, stock=?, options=?, images=?, featured=?, active=?, sort=? WHERE id=?')
        .bind(...values, id)
        .run();
      return json({ ok: true, id });
    }
    const row = await db
      .prepare('INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, active, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id')
      .bind(...values)
      .first();
    return json({ ok: true, id: row.id }, 201);
  } catch (err) {
    if (String(err).includes('UNIQUE')) return json({ error: 'slug_taken' }, 409);
    throw err;
  }
}

async function saveCategory(db, id, b) {
  if (!b) return json({ error: 'bad_request' }, 400);
  const name_fr = String(b.name_fr || '').trim();
  const name_ar = String(b.name_ar || '').trim();
  const name_en = String(b.name_en || '').trim();
  if (!name_fr && !name_ar && !name_en) return json({ error: 'name_required' }, 422);
  const slug = slugify(b.slug || name_fr || name_en) || `categorie-${Date.now().toString(36)}`;
  try {
    if (id) {
      await db.prepare('UPDATE categories SET slug=?, name_ar=?, name_fr=?, name_en=?, sort=? WHERE id=?').bind(slug, name_ar, name_fr, name_en, int(b.sort, 0), id).run();
      return json({ ok: true, id });
    }
    const row = await db.prepare('INSERT INTO categories (slug, name_ar, name_fr, name_en, sort) VALUES (?,?,?,?,?) RETURNING id').bind(slug, name_ar, name_fr, name_en, int(b.sort, 0)).first();
    return json({ ok: true, id: row.id }, 201);
  } catch (err) {
    if (String(err).includes('UNIQUE')) return json({ error: 'slug_taken' }, 409);
    throw err;
  }
}
