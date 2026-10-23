// Small helpers shared by the storefront, the public API and the admin API.

export const LANGS = ['ar', 'fr', 'en'];
export const DEFAULT_LANG = 'fr';

// Order statuses, in the order they usually happen. "cancelled" and "returned" put the stock back.
export const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
export const RESTOCK_STATUSES = ['cancelled', 'returned'];

// Cities offered at checkout. Shipping can be set per city in the admin (Réglages).
export const CITIES = [
  'Casablanca', 'Rabat', 'Salé', 'Témara', 'Kénitra', 'Mohammedia', 'Marrakech', 'Fès', 'Meknès', 'Tanger',
  'Tétouan', 'Agadir', 'Oujda', 'El Jadida', 'Safi', 'Béni Mellal', 'Khouribga', 'Settat', 'Berrechid',
  'Nador', 'Al Hoceïma', 'Larache', 'Ksar El Kébir', 'Taza', 'Errachidia', 'Ouarzazate', 'Essaouira',
  'Laâyoune', 'Dakhla', 'Guelmim', 'Tiznit', 'Taroudant', 'Inezgane', 'Khémisset', 'Berkane',
];

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Prices are whole dirhams. Moroccan shops write Latin digits in all three languages.
export function money(amount, lang) {
  const n = Math.round(Number(amount) || 0);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' ');
  const sign = n < 0 ? '-' : '';
  if (lang === 'ar') return `${sign}${digits} درهم`;
  if (lang === 'en') return `${sign}MAD ${digits}`;
  return `${sign}${digits} DH`;
}

// Accepts 06 12 34 56 78, 0612345678, +212 6 12 34 56 78, 00212612345678 (also 05 landlines and 07).
// Returns the international form 212XXXXXXXXX, or null when it is not a Moroccan number.
export function normalizePhone(input) {
  let d = String(input ?? '').replace(/[\s.\-()]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('212')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return /^[5-7]\d{8}$/.test(d) ? `212${d}` : null;
}

export function displayPhone(intl) {
  const d = String(intl || '');
  return d.startsWith('212') && d.length === 12 ? `0${d.slice(3, 4)} ${d.slice(4).replace(/(\d{2})(?=\d)/g, '$1 ')}` : d;
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function parseJSON(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
  });
}

// A short, salted hash of the visitor's IP address: enough to count their attempts, not to identify them.
export async function visitorId(request, salt = '') {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(d).slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Number of hits recorded for a bucket in the last `seconds`.
export async function recentHits(db, bucket, seconds) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM rate_hits WHERE bucket = ? AND at > ?').bind(bucket, Date.now() - seconds * 1000).first();
  return row?.n || 0;
}

export async function addHit(db, bucket) {
  await db.batch([
    db.prepare('INSERT INTO rate_hits (bucket, at) VALUES (?, ?)').bind(bucket, Date.now()),
    // Keep the table small: nothing older than two days is ever looked at.
    db.prepare('DELETE FROM rate_hits WHERE at < ?').bind(Date.now() - 2 * 864e5),
  ]);
}

// Browsers send Origin on cross-site writes; refuse any that does not come from this site.
export function sameOrigin(request, url) {
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}

// Checks the first bytes of an upload so a file can't pretend to be a photo.
export function looksLikeImage(bytes, type) {
  const b = new Uint8Array(bytes.slice ? bytes.slice(0, 16) : bytes);
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (type === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === 'image/png') return b[0] === 0x89 && ascii(1, 4) === 'PNG';
  if (type === 'image/gif') return ascii(0, 4) === 'GIF8';
  if (type === 'image/webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (type === 'image/avif') return ascii(4, 8) === 'ftyp' && /avi[fs]/.test(ascii(8, 12));
  return false;
}

// MP4 and QuickTime files start with a box whose type is "ftyp"; WebM starts with the EBML header.
export function looksLikeVideo(bytes, type) {
  const b = new Uint8Array(bytes.slice ? bytes.slice(0, 16) : bytes);
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (type === 'video/mp4' || type === 'video/quicktime') return ascii(4, 8) === 'ftyp';
  if (type === 'video/webm') return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  return false;
}

export function randomToken(bytes = 16) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Order numbers like 241022-7KQ3: the date plus 4 random characters, easy to read out on the phone.
export function orderNumber(date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const r = crypto.getRandomValues(new Uint8Array(4));
  return `${ymd}-${[...r].map((b) => alphabet[b % alphabet.length]).join('')}`;
}

// Shipping for a city: a per-city rate if one is set, else the default; free above the threshold.
export function shippingFor(city, subtotal, settings) {
  const free = Number(settings.free_shipping_over) || 0;
  if (free > 0 && subtotal >= free) return 0;
  const rates = parseJSON(settings.shipping_rates || '{}', {});
  if (city && rates[city] != null) return Math.max(0, Math.round(Number(rates[city]) || 0));
  return Math.max(0, Math.round(Number(settings.shipping_fee) || 0));
}

export function productName(p, lang) {
  return p[`name_${lang}`] || p.name_fr || p.name_en || p.name_ar || '';
}

export function productDesc(p, lang) {
  return p[`desc_${lang}`] || p.desc_fr || p.desc_en || p.desc_ar || '';
}

export function productImages(p) {
  const list = parseJSON(p.images || '[]', []);
  return Array.isArray(list) ? list.filter((u) => typeof u === 'string' && u) : [];
}

export function productOptions(p) {
  return String(p.options || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function getSettings(db) {
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

// Prices a cart against the database. Unknown, inactive or out-of-stock products are dropped,
// quantities are capped by stock, and an option must be one the product offers.
export async function quote(db, rawItems, city, settings) {
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, 50);
  const ids = [...new Set(items.map((i) => Number(i?.id)).filter((n) => Number.isInteger(n) && n > 0))];
  if (!ids.length) return { lines: [], subtotal: 0, shipping: 0, total: 0, issues: [] };
  const { results } = await db
    .prepare(`SELECT * FROM products WHERE active = 1 AND id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all();
  const byId = new Map(results.map((p) => [p.id, p]));
  const lines = [];
  const issues = [];
  const used = new Map();
  for (const item of items) {
    const p = byId.get(Number(item?.id));
    if (!p) {
      issues.push({ id: item?.id, issue: 'unavailable' });
      continue;
    }
    const options = productOptions(p);
    const option = options.length ? String(item.option || '') : '';
    if (options.length && !options.includes(option)) {
      issues.push({ id: p.id, issue: 'option' });
      continue;
    }
    let qty = Math.min(20, Math.max(1, Math.floor(Number(item.qty) || 1)));
    if (p.stock != null) {
      const left = p.stock - (used.get(p.id) || 0);
      if (left <= 0) {
        issues.push({ id: p.id, issue: 'stock' });
        continue;
      }
      if (qty > left) {
        qty = left;
        issues.push({ id: p.id, issue: 'qty' });
      }
    }
    used.set(p.id, (used.get(p.id) || 0) + qty);
    lines.push({ product: p, id: p.id, option, qty, price: p.price, total: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = lines.length ? shippingFor(city, subtotal, settings) : 0;
  return { lines, subtotal, shipping, total: subtotal + shipping, issues };
}
