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

// Rich product descriptions (written in the admin's editor) are stored as HTML.
// Only a small allowlist of tags and attributes survives, both when saving and when showing it.
const RICH_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'figure', 'figcaption', 'hr', 'span', 'div']);
const RICH_VOID = new Set(['br', 'hr', 'img']);
const RICH_DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math', 'textarea', 'select', 'button', 'form', 'head', 'title']);
const RICH_RENAME = { b: 'strong', i: 'em', div: 'p', font: 'span', strike: 's', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3' };

function decodeAttr(v) {
  return v
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function safeUrl(v, media) {
  const u = decodeAttr(v).replace(/[\u0000- \u007f-\u009f]/g, '');
  if (media) return /^\/(img|assets)\/[a-z0-9/_.-]+(#t=[\d.]+)?$/i.test(u) || /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : '';
  if (/^(https?:\/\/|mailto:|tel:)[^\s"'<>]+$/i.test(u) || /^\/(?!\/)[^\s"'<>]*$/.test(u) || /^#[\w-]*$/.test(u)) return u;
  return '';
}

function safeStyle(v) {
  const out = [];
  for (const decl of decodeAttr(v).split(';')) {
    const [prop, ...rest] = decl.split(':');
    const p = (prop || '').trim().toLowerCase();
    const val = rest.join(':').trim().toLowerCase();
    if (p === 'text-align' && /^(left|right|center|justify|start|end)$/.test(val)) out.push(`text-align:${val}`);
    if (p === 'color' && /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/.test(val)) out.push(`color:${val}`);
  }
  return out.join(';');
}

export function sanitizeHtml(html) {
  const src = String(html || '').slice(0, 200000);
  const out = [];
  const stack = [];
  let dropDepth = 0;
  let dropTag = '';
  const re = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>|<[!?\/][^>]*>/g;
  let last = 0;
  const text = (t) => {
    if (dropDepth) return;
    out.push(t.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  };
  let m;
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    last = re.lastIndex;
    if (!m[2]) continue; // comment, doctype or junk
    const closing = m[1] === '/';
    const raw = m[2].toLowerCase();
    if (RICH_DROP.has(raw)) {
      if (!closing && !dropDepth) {
        dropDepth = 1;
        dropTag = raw;
      } else if (!closing && raw === dropTag) dropDepth++;
      else if (closing && raw === dropTag && dropDepth) dropDepth--;
      continue;
    }
    if (dropDepth) continue;
    const tag = RICH_RENAME[raw] || raw;
    if (!RICH_TAGS.has(tag)) continue;
    if (closing) {
      const at = stack.map((x) => x[0]).lastIndexOf(tag);
      if (at === -1) continue;
      while (stack.length > at) out.push(`</${stack.pop()[1]}>`);
      continue;
    }
    const attrs = {};
    const ar = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let a;
    while ((a = ar.exec(m[3] || ''))) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
    let extra = '';
    const style = attrs.style ? safeStyle(attrs.style) : '';
    if (raw === 'font' && attrs.color && /^#[0-9a-f]{3,8}$/i.test(attrs.color)) extra += ` style="color:${attrs.color.toLowerCase()}"`;
    else if (style && tag !== 'img' && tag !== 'video') extra += ` style="${style}"`;
    if (attrs.dir && /^(rtl|ltr|auto)$/i.test(attrs.dir)) extra += ` dir="${attrs.dir.toLowerCase()}"`;
    if (tag === 'a') {
      const href = attrs.href ? safeUrl(attrs.href, false) : '';
      if (!href) {
        stack.push(['a', 'span']);
        out.push('<span>');
        continue;
      }
      extra += ` href="${esc(href)}"`;
      if (/^https?:/i.test(href)) extra += ' target="_blank" rel="noopener nofollow"';
    }
    if (tag === 'img') {
      const s = attrs.src ? safeUrl(attrs.src, true) : '';
      if (!s) continue;
      out.push(`<img src="${esc(s)}" alt="${esc(decodeAttr(attrs.alt || ''))}" loading="lazy">`);
      continue;
    }
    if (tag === 'video') {
      const s = attrs.src ? safeUrl(attrs.src, true) : '';
      if (!s) {
        stack.push(['video', 'span']);
        out.push('<span>');
        continue;
      }
      out.push(`<video src="${esc(s)}${s.includes('#') ? '' : '#t=0.1'}" controls playsinline preload="metadata">`);
      stack.push(['video', 'video']);
      continue;
    }
    if (RICH_VOID.has(tag)) {
      out.push(`<${tag}>`);
      continue;
    }
    out.push(`<${tag}${extra}>`);
    stack.push([tag, tag]);
  }
  text(src.slice(last));
  while (stack.length) out.push(`</${stack.pop()[1]}>`);
  return out.join('');
}

// Old descriptions are plain text; new ones are HTML from the editor.
export function isRichHtml(s) {
  return /<\/?(p|br|h[1-6]|ul|ol|li|strong|em|b|i|u|s|a|img|video|figure|blockquote|hr|span|div)\b/i.test(String(s || ''));
}

export function richDescHtml(s) {
  return isRichHtml(s) ? sanitizeHtml(s) : esc(String(s || '')).replace(/\n/g, '<br>');
}

export function htmlToText(s) {
  if (!isRichHtml(s)) return String(s || '');
  return decodeAttr(
    String(s)
      .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote)\b[^>]*>/gi, ' ')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}
