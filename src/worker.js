// Store Worker: renders the storefront (/ar, /fr, /en), serves the order API (/api/*),
// the admin API (/api/admin/*), product photos from R2 (/img/*) and static files (public/).

import { T } from './i18n.js';
import { LANGS, DEFAULT_LANG, CITIES, json, esc, getSettings, quote, normalizePhone, orderNumber, randomToken, productName } from './lib.js';
import { homePage, listingPage, productPage, cartPage, checkoutPage, orderPage, notFoundPage, catName } from './render.js';
import { handleAdmin } from './admin.js';

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', ...SECURITY_HEADERS },
  });
}

function pickLang(request) {
  const cookie = request.headers.get('cookie') || '';
  const saved = cookie.match(/(?:^|;\s*)lang=(ar|fr|en)/);
  if (saved) return saved[1];
  const accept = (request.headers.get('accept-language') || '').toLowerCase();
  for (const part of accept.split(',')) {
    const code = part.trim().slice(0, 2);
    if (LANGS.includes(code)) return code;
  }
  return DEFAULT_LANG;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path.startsWith('/api/admin/')) return await handleAdmin(request, env, url);
      if (path.startsWith('/api/')) return await handleApi(request, env, url);
      if (path.startsWith('/img/')) return await serveImage(env, path.slice(5), request);
      if (path === '/admin') return Response.redirect(`${url.origin}/admin/`, 301);
      if (path === '/sitemap.xml') return await sitemap(env, url.origin);
      if (path === '/robots.txt') {
        return new Response(`User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${url.origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain' } });
      }
      if (path === '/') {
        return new Response(null, { status: 302, headers: { location: `/${pickLang(request)}/`, vary: 'accept-language, cookie' } });
      }
      const m = path.match(/^\/(ar|fr|en)(\/.*)?$/);
      if (m) {
        if (!m[2]) return Response.redirect(`${url.origin}/${m[1]}/${url.search}`, 301);
        return await storefront(request, env, url, m[1], m[2]);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      if (path.startsWith('/api/')) return json({ error: 'server' }, 500);
      return html('<!doctype html><meta charset="utf-8"><title>Error</title><p>Something went wrong. Please try again.</p>', 500);
    }
  },
};

async function storefront(request, env, url, lang, rest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const db = env.DB;
  const [settings, cats] = await Promise.all([getSettings(db), db.prepare('SELECT * FROM categories ORDER BY sort, id').all()]);
  const categories = cats.results;
  const ctx = { lang, settings, categories, origin: url.origin };
  const t = T[lang];
  let res;

  if (rest === '/') {
    const featured = await db.prepare('SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY sort, id DESC LIMIT 8').all();
    const latest = await db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id DESC LIMIT 12').all();
    res = html(homePage(ctx, featured.results, latest.results));
  } else if (rest === '/shop') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
    let rows;
    if (q) {
      const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      rows = await db
        .prepare("SELECT * FROM products WHERE active = 1 AND (name_ar LIKE ?1 ESCAPE '\\' OR name_fr LIKE ?1 ESCAPE '\\' OR name_en LIKE ?1 ESCAPE '\\') ORDER BY sort, id DESC LIMIT 100")
        .bind(like)
        .all();
    } else {
      rows = await db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort, id DESC LIMIT 200').all();
    }
    res = html(listingPage(ctx, { title: t.allProducts, path: '/shop', products: rows.results, q }));
  } else if (rest.startsWith('/c/')) {
    const cat = categories.find((c) => c.slug === decodeURIComponent(rest.slice(3)));
    if (!cat) return html(notFoundPage(ctx), 404);
    const rows = await db.prepare('SELECT * FROM products WHERE active = 1 AND category_id = ? ORDER BY sort, id DESC LIMIT 200').bind(cat.id).all();
    res = html(listingPage(ctx, { title: catName(cat, lang), path: `/c/${cat.slug}`, products: rows.results }));
  } else if (rest.startsWith('/p/')) {
    const p = await db.prepare('SELECT * FROM products WHERE active = 1 AND slug = ?').bind(decodeURIComponent(rest.slice(3))).first();
    if (!p) return html(notFoundPage(ctx), 404);
    const related = await db
      .prepare('SELECT * FROM products WHERE active = 1 AND id != ? AND (category_id IS ? OR featured = 1) ORDER BY RANDOM() LIMIT 4')
      .bind(p.id, p.category_id)
      .all();
    res = html(productPage(ctx, p, categories.find((c) => c.id === p.category_id), related.results));
  } else if (rest === '/cart') {
    res = html(cartPage(ctx));
  } else if (rest === '/checkout') {
    res = html(checkoutPage(ctx));
  } else if (rest.startsWith('/order/')) {
    const order = await db.prepare('SELECT * FROM orders WHERE number = ? AND token = ?').bind(rest.slice(7), url.searchParams.get('t') || '').first();
    if (!order) return html(notFoundPage(ctx), 404);
    const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(order.id).all();
    res = html(orderPage(ctx, order, items.results));
  } else {
    return html(notFoundPage(ctx), 404);
  }
  res.headers.append('set-cookie', `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  return res;
}

async function readJSON(request, limit = 20000) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return null;
  const text = await request.text();
  if (text.length > limit) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function publicLine(line, lang) {
  const p = line.product;
  return { id: line.id, option: line.option, qty: line.qty, price: line.price, total: line.total, name: productName(p, lang), slug: p.slug, image: (JSON.parse(p.images || '[]')[0]) || '/assets/placeholder.svg', stock: p.stock };
}

async function handleApi(request, env, url) {
  const lang = LANGS.includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : DEFAULT_LANG;

  // POST /api/quote {items, city} → the cart priced by the server (the browser's copy is never trusted).
  if (url.pathname === '/api/quote' && request.method === 'POST') {
    const body = await readJSON(request);
    if (!body) return json({ error: 'bad_request' }, 400);
    const settings = await getSettings(env.DB);
    const q = await quote(env.DB, body.items, body.city, settings);
    return json({ lines: q.lines.map((l) => publicLine(l, lang)), subtotal: q.subtotal, shipping: q.shipping, total: q.total, issues: q.issues, freeOver: Number(settings.free_shipping_over) || 0 });
  }

  // POST /api/orders {items, name, phone, city, address, note, lang} → a cash-on-delivery order.
  if (url.pathname === '/api/orders' && request.method === 'POST') {
    const body = await readJSON(request);
    if (!body) return json({ error: 'bad_request' }, 400);
    if (body.website) return json({ error: 'bad_request' }, 400); // honeypot filled in by a bot
    const orderLang = LANGS.includes(body.lang) ? body.lang : lang;
    const name = String(body.name || '').trim().slice(0, 80);
    const phone = normalizePhone(body.phone);
    let city = String(body.city || '').trim().slice(0, 60);
    const address = String(body.address || '').trim().slice(0, 300);
    const note = String(body.note || '').trim().slice(0, 500);
    const errors = {};
    if (name.length < 2) errors.name = 'required';
    if (!phone) errors.phone = 'phone';
    if (!city) errors.city = 'required';
    if (address.length < 4) errors.address = 'required';
    if (Object.keys(errors).length) return json({ error: 'invalid', fields: errors }, 422);
    const known = CITIES.find((c) => c.toLowerCase() === city.toLowerCase());
    if (known) city = known;

    const db = env.DB;
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE phone = ? AND created_at > datetime('now', '-1 hour')").bind(phone).first();
    if (recent.n >= 5) return json({ error: 'too_many' }, 429);

    const settings = await getSettings(db);
    const q = await quote(db, body.items, city, settings);
    if (!q.lines.length) return json({ error: 'empty' }, 422);
    if (q.issues.length) return json({ error: 'cart_changed', issues: q.issues }, 409);

    const number = orderNumber();
    const token = randomToken();
    const statements = [
      db
        .prepare('INSERT INTO orders (number, token, status, name, phone, city, address, note, lang, subtotal, shipping, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(number, token, 'new', name, phone, city, address, note, orderLang, q.subtotal, q.shipping, q.total),
    ];
    for (const l of q.lines) {
      statements.push(
        db
          .prepare('INSERT INTO order_items (order_id, product_id, name, option, price, qty) VALUES ((SELECT id FROM orders WHERE number = ?), ?, ?, ?, ?, ?)')
          .bind(number, l.id, productName(l.product, 'fr'), l.option, l.price, l.qty),
      );
      // The CHECK (stock >= 0) on products makes this fail, and the whole order roll back, if stock ran out meanwhile.
      statements.push(db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL').bind(l.qty, l.id));
    }
    try {
      await db.batch(statements);
    } catch (err) {
      if (String(err).includes('CHECK')) return json({ error: 'cart_changed', issues: [{ issue: 'stock' }] }, 409);
      throw err;
    }
    if (env.ORDER_WEBHOOK) {
      // Optional: notify a webhook (Telegram bot, Slack, Make, Zapier…) about the new order.
      const text = `Nouvelle commande ${number}: ${name}, ${city}, ${q.total} DH`;
      await fetch(env.ORDER_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, number, total: q.total, city }) }).catch(() => {});
    }
    return json({ number, url: `/${orderLang}/order/${number}?t=${token}` }, 201);
  }

  return json({ error: 'not_found' }, 404);
}

async function serveImage(env, key, request) {
  if (!env.IMAGES || !/^[a-z0-9/_-]+\.(jpe?g|png|webp|gif|avif)$/i.test(key)) return new Response('Not found', { status: 404 });
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  if (request.headers.get('if-none-match') === obj.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}

async function sitemap(env, origin) {
  const [products, cats] = await Promise.all([
    env.DB.prepare('SELECT slug FROM products WHERE active = 1').all(),
    env.DB.prepare('SELECT slug FROM categories').all(),
  ]);
  const paths = ['/', '/shop', ...cats.results.map((c) => `/c/${c.slug}`), ...products.results.map((p) => `/p/${p.slug}`)];
  const urls = paths
    .map((p) => {
      const alts = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(origin)}/${l}${esc(p)}"/>`).join('');
      return LANGS.map((l) => `<url><loc>${esc(origin)}/${l}${esc(p)}</loc>${alts}</url>`).join('');
    })
    .join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
