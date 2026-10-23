// Admin API (/api/admin/*), used by public/admin/. Protected by the ADMIN_PASSWORD secret:
// logging in sets a signed, HttpOnly session cookie that lasts 7 days.

import { sendEmail, sendStatusEmail, emailConfig, confirmationEmail, validEmail, STATUS_EMAILS } from './email.js';
import { json, getSettings, slugify, STATUSES, RESTOCK_STATUSES, randomToken, parseJSON, displayPhone, visitorId, recentHits, addHit, sameOrigin, looksLikeImage, looksLikeVideo } from './lib.js';

const SESSION_DAYS = 7;
// Password guessing: after 5 wrong passwords in 15 minutes, or 20 in a day, that visitor is locked out for a while.
const LOGIN_LIMITS = [[5, 15 * 60], [20, 24 * 3600]];
const COOKIE = 'admin_session';
const SETTING_KEYS = [
  'store_name', 'whatsapp', 'contact_email', 'shipping_fee', 'shipping_rates', 'free_shipping_over',
  'announcement_ar', 'announcement_fr', 'announcement_en',
  'hero_title_ar', 'hero_title_fr', 'hero_title_en', 'hero_text_ar', 'hero_text_fr', 'hero_text_en',
  'email_from', 'notify_email', 'email_status_updates',
  'instagram', 'facebook', 'tiktok', 'meta_pixel_id', 'tiktok_pixel_id',
  'legal_name', 'legal_ice', 'legal_rc', 'legal_address', 'legal_cndp',
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

export async function handleAdmin(request, env, url, ctx) {
  const path = url.pathname.slice('/api/admin'.length);
  const method = request.method;
  const secret = env.ADMIN_PASSWORD;
  if (!secret) return json({ error: 'ADMIN_PASSWORD is not set. Run: npx wrangler secret put ADMIN_PASSWORD' }, 503);

  if (method !== 'GET' && !sameOrigin(request, url)) return json({ error: 'bad_origin' }, 403);

  if (path === '/login' && method === 'POST') {
    const bucket = `login:${await visitorId(request, secret)}`;
    for (const [max, seconds] of LOGIN_LIMITS) {
      if ((await recentHits(env.DB, bucket, seconds)) >= max) return json({ error: 'locked', minutes: Math.ceil(seconds / 60) }, 429);
    }
    const b = await body(request);
    if (!b || !(await samePassword(String(b.password || '').slice(0, 200), secret))) {
      await addHit(env.DB, bucket);
      await new Promise((r) => setTimeout(r, 800));
      return json({ error: 'wrong_password' }, 401);
    }
    const token = await makeSession(secret);
    await env.DB.prepare('DELETE FROM rate_hits WHERE bucket = ?').bind(bucket).run();
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

  if (path === '/me') return json({ ok: true, images: true, r2: Boolean(env.IMAGES), emails: Boolean(env.BREVO_API_KEY), weak_password: secret.length < 12 });

  if (path === '/stats' && method === 'GET') {
    // Dashboard numbers. Days are counted in Morocco time (UTC+1).
    const day = "date(created_at, '+1 hour')";
    const live = "status NOT IN ('cancelled', 'returned')";
    const [kpi, daily, byStatus, top, cities, recent, low] = await db.batch([
      db.prepare(
        `SELECT
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_orders,
          SUM(CASE WHEN ${day} = date('now', '+1 hour') THEN 1 ELSE 0 END) AS today,
          SUM(CASE WHEN ${day} = date('now', '+1 hour') AND ${live} THEN total ELSE 0 END) AS today_sales,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) AS orders_30d,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') AND ${live} THEN total ELSE 0 END) AS sales_30d,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') AND status = 'delivered' THEN total ELSE 0 END) AS revenue_30d,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') AND status = 'delivered' THEN 1 ELSE 0 END) AS delivered_30d,
          SUM(CASE WHEN created_at > datetime('now', '-30 days') AND status IN ('cancelled', 'returned') THEN 1 ELSE 0 END) AS failed_30d,
          SUM(CASE WHEN created_at BETWEEN datetime('now', '-60 days') AND datetime('now', '-30 days') THEN 1 ELSE 0 END) AS orders_prev,
          SUM(CASE WHEN created_at BETWEEN datetime('now', '-60 days') AND datetime('now', '-30 days') AND ${live} THEN total ELSE 0 END) AS sales_prev
        FROM orders`,
      ),
      db.prepare(`SELECT ${day} AS d, COUNT(*) AS orders, SUM(CASE WHEN ${live} THEN total ELSE 0 END) AS sales FROM orders WHERE created_at > datetime('now', '-30 days') GROUP BY d ORDER BY d`),
      db.prepare("SELECT status, COUNT(*) AS n FROM orders WHERE created_at > datetime('now', '-30 days') GROUP BY status"),
      db.prepare(
        `SELECT i.product_id, i.name, SUM(i.qty) AS qty, SUM(i.qty * i.price) AS sales, (SELECT json_extract(p.images, '$[0]') FROM products p WHERE p.id = i.product_id) AS image, (SELECT p.name_ar FROM products p WHERE p.id = i.product_id) AS name_ar
         FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE o.created_at > datetime('now', '-30 days') AND o.${live}
         GROUP BY i.product_id, i.name ORDER BY qty DESC, sales DESC LIMIT 5`,
      ),
      db.prepare(`SELECT city, COUNT(*) AS n, SUM(total) AS sales FROM orders WHERE created_at > datetime('now', '-30 days') AND ${live} GROUP BY city ORDER BY n DESC LIMIT 5`),
      db.prepare('SELECT id, number, status, name, city, total, created_at FROM orders ORDER BY id DESC LIMIT 6'),
      db.prepare('SELECT id, name_fr, name_ar, stock, images FROM products WHERE active = 1 AND stock IS NOT NULL AND stock <= 3 ORDER BY stock LIMIT 10'),
    ]);
    return json({
      ...kpi.results[0],
      daily: daily.results,
      by_status: Object.fromEntries(byStatus.results.map((r) => [r.status, r.n])),
      top_products: top.results,
      top_cities: cities.results,
      recent: recent.results,
      low_stock: low.results,
    });
  }

  // Sends a sample order confirmation to the notification address, to check the email setup.
  if (path === '/test-email' && method === 'POST') {
    const settings = await getSettings(db);
    const cfg = emailConfig(env, settings);
    if (!env.BREVO_API_KEY) return json({ error: 'no_email_key' }, 400);
    if (!validEmail(cfg.from)) return json({ error: 'no_email_from' }, 400);
    if (!validEmail(cfg.notify)) return json({ error: 'no_notify_email' }, 400);
    const order = { id: 0, number: 'TEST-0000', token: 'test', lang: 'fr', name: 'Client test', phone: '212600000000', email: cfg.notify, city: 'Casablanca', address: 'Adresse test', note: '', shipping: 20, total: 220 };
    const m = confirmationEmail({ order, items: [{ name: 'Produit test', option: '', price: 200, qty: 1 }], origin: url.origin, cfg, settings });
    try {
      await sendEmail(env, cfg, { to: cfg.notify, ...m, subject: `[Test] ${m.subject}` });
    } catch (err) {
      return json({ error: 'email_failed', detail: String(err.message).slice(0, 300) }, 502);
    }
    return json({ ok: true, to: cfg.notify });
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
    const sql = `SELECT id, number, status, name, phone, email, city, total, created_at FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 50 OFFSET ?`;
    const rows = await db.prepare(sql).bind(...args, (page - 1) * 50).all();
    const counts = await db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all();
    return json({ orders: rows.results.map((o) => ({ ...o, phone_display: displayPhone(o.phone) })), page, counts: Object.fromEntries(counts.results.map((r) => [r.status, r.n])) });
  }

  if (path === '/orders.csv' && method === 'GET') {
    const status = url.searchParams.get('status');
    const rows = await db
      .prepare(`SELECT o.*, (SELECT group_concat(name || CASE WHEN option != '' THEN ' (' || option || ')' ELSE '' END || ' x' || qty, ' + ') FROM order_items WHERE order_id = o.id) AS items FROM orders o ${STATUSES.includes(status) ? 'WHERE status = ?' : ''} ORDER BY id DESC LIMIT 5000`)
      .bind(...(STATUSES.includes(status) ? [status] : []))
      .all();
    const cols = ['number', 'created_at', 'status', 'name', 'phone', 'email', 'city', 'address', 'items', 'subtotal', 'shipping', 'total', 'note', 'admin_note'];
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
      let emailed = false;
      if (next !== order.status && order.email && b.notify !== false) {
        const settings = await getSettings(db);
        const items = await db.prepare('SELECT name, option, price, qty FROM order_items WHERE order_id = ?').bind(id).all();
        emailed = emailConfig(env, settings).on && settings.email_status_updates !== '0' && STATUS_EMAILS.includes(next);
        ctx.waitUntil(sendStatusEmail(env, settings, url.origin, { ...order, status: next }, items.results));
      }
      return json({ ok: true, emailed });
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

  // Image upload: raw file body → R2 when it is set up, otherwise the images table in D1 → /img/<key>
  if (path === '/images' && method === 'POST') {
    const type = (request.headers.get('content-type') || '').split(';')[0];
    if (VIDEO_EXT[type]) return uploadVideo(env, request, type);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[type];
    if (!ext) return json({ error: 'bad_type' }, 415);
    const data = await request.arrayBuffer();
    if (data.byteLength > (env.IMAGES ? 5 : 1.8) * 1024 * 1024) return json({ error: 'too_large' }, 413);
    if (!looksLikeImage(data, type)) return json({ error: 'bad_type' }, 415);
    const key = `p/${Date.now().toString(36)}-${randomToken(6)}.${ext}`;
    if (env.IMAGES) await env.IMAGES.put(key, data, { httpMetadata: { contentType: type } });
    else await db.prepare('INSERT INTO images (key, type, data, size) VALUES (?, ?, ?, ?)').bind(key, type, data, data.byteLength).run();
    return json({ url: `/img/${key}` }, 201);
  }


  return json({ error: 'not_found' }, 404);
}

// Videos for product descriptions (5 MB max). Without R2 they go to D1 in 1.5 MB pieces,
// because a single D1 value can't be larger than 2 MB.
const VIDEO_EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
export const VIDEO_MAX = 5 * 1024 * 1024;
export const CHUNK = 1.5 * 1024 * 1024;

async function uploadVideo(env, request, type) {
  const data = await request.arrayBuffer();
  if (data.byteLength > VIDEO_MAX) return json({ error: 'video_too_large' }, 413);
  if (!looksLikeVideo(data, type)) return json({ error: 'bad_type' }, 415);
  const key = `v/${Date.now().toString(36)}-${randomToken(6)}.${VIDEO_EXT[type]}`;
  if (env.IMAGES) {
    await env.IMAGES.put(key, data, { httpMetadata: { contentType: type } });
  } else {
    for (let i = 0, off = 0; off < data.byteLength; i++, off += CHUNK) {
      await env.DB.prepare('INSERT INTO media_chunks (key, idx, data) VALUES (?, ?, ?)').bind(key, i, data.slice(off, off + CHUNK)).run();
    }
    await env.DB.prepare('INSERT INTO images (key, type, data, size) VALUES (?, ?, ?, ?)').bind(key, type, new ArrayBuffer(0), data.byteLength).run();
  }
  return json({ url: `/img/${key}` }, 201);
}

// Photos and videos shown in the description: [{ type: 'image' | 'video', url }], our own uploads or https links.
function descMedia(v) {
  let arr = v;
  if (typeof v === 'string') {
    try {
      arr = JSON.parse(v || '[]');
    } catch {
      arr = [];
    }
  }
  return (Array.isArray(arr) ? arr : [])
    .map((m) => ({ type: m && m.type === 'video' ? 'video' : 'image', url: String((m && m.url) || '').trim() }))
    .filter((m) => m.url.startsWith('/img/') || m.url.startsWith('https://'))
    .slice(0, 20);
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
    JSON.stringify(descMedia(b.desc_media)),
  ];
  try {
    if (id) {
      await db
        .prepare('UPDATE products SET slug=?, category_id=?, name_ar=?, name_fr=?, name_en=?, desc_ar=?, desc_fr=?, desc_en=?, price=?, compare_price=?, stock=?, options=?, images=?, featured=?, active=?, sort=?, desc_media=? WHERE id=?')
        .bind(...values, id)
        .run();
      return json({ ok: true, id });
    }
    const row = await db
      .prepare('INSERT INTO products (slug, category_id, name_ar, name_fr, name_en, desc_ar, desc_fr, desc_en, price, compare_price, stock, options, images, featured, active, sort, desc_media) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id')
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
  const image = String(b.image || '').trim();
  const imageOk = image === '' || image.startsWith('/') || image.startsWith('https://') ? image.slice(0, 500) : '';
  try {
    if (id) {
      await db.prepare('UPDATE categories SET slug=?, name_ar=?, name_fr=?, name_en=?, sort=?, image=? WHERE id=?').bind(slug, name_ar, name_fr, name_en, int(b.sort, 0), imageOk, id).run();
      return json({ ok: true, id });
    }
    const row = await db.prepare('INSERT INTO categories (slug, name_ar, name_fr, name_en, sort, image) VALUES (?,?,?,?,?,?) RETURNING id').bind(slug, name_ar, name_fr, name_en, int(b.sort, 0), imageOk).first();
    return json({ ok: true, id: row.id }, 201);
  } catch (err) {
    if (String(err).includes('UNIQUE')) return json({ error: 'slug_taken' }, 409);
    throw err;
  }
}
