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

// Product options (variants): groups such as Colour or Size, each with values the customer picks one of.
// Stored as JSON in products.options:
//   [{ name: {ar, fr, en}, type: 'text' | 'color', values: [{ label, color, price }] }]
// `price` is added to (or, when negative, taken from) the product price for that choice.
// Older products hold a plain comma list ("S, M, L"); it is read as one unnamed group.
const OPTION_SEP = ' / ';
const cleanLabel = (v) => String(v ?? '').replace(/\s*\/\s*/g, '/').replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

// With quantity offers the column holds an object instead: { groups: [...], bundles: [...] } (see cleanBundles).
function optionsData(raw) {
  if (typeof raw !== 'string') return raw;
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith('[') || text.startsWith('{')) return parseJSON(text, []);
  return [{ values: text.split(',').map((label) => ({ label })) }];
}

export function cleanOptions(raw) {
  let list = optionsData(raw);
  if (list && !Array.isArray(list) && typeof list === 'object') list = list.groups;
  if (!Array.isArray(list)) return [];
  const groups = [];
  for (const g of list.slice(0, 6)) {
    if (!g || typeof g !== 'object') continue;
    const n = g.name && typeof g.name === 'object' ? g.name : { fr: g.name };
    const name = Object.fromEntries(['ar', 'fr', 'en'].map((l) => [l, String(n[l] ?? '').trim().slice(0, 40)]));
    const type = g.type === 'color' ? 'color' : 'text';
    const seen = new Set();
    const values = [];
    for (const v of Array.isArray(g.values) ? g.values.slice(0, 40) : []) {
      const label = cleanLabel(typeof v === 'object' && v ? v.label : v);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      const price = Math.max(-100000, Math.min(100000, Math.round(Number(v?.price) || 0)));
      const color = /^#[0-9a-f]{6}$/i.test(v?.color || '') ? v.color.toLowerCase() : '';
      values.push({ label, ...(type === 'color' ? { color: color || '#cccccc' } : {}), price });
    }
    if (values.length) groups.push({ name, type, values });
  }
  return groups;
}

export function productOptions(p) {
  return cleanOptions(p.options || '');
}

// Quantity offers ("2 for 340 DH, 3 for 480 DH"): each one is a number of pieces and the price for all of them
// at the product's base price, with an optional title per language and a "most popular" flag.
//   [{ qty, price, label: {ar, fr, en}, hot }]
// One piece at the normal price is always offered first, so only offers from 2 pieces up are stored.
export function cleanBundles(raw) {
  const data = optionsData(raw);
  const list = Array.isArray(data) ? null : data?.bundles;
  if (!Array.isArray(list)) return [];
  const byQty = new Map();
  for (const b of list.slice(0, 8)) {
    const qty = Math.floor(Number(b?.qty));
    const price = Math.round(Number(b?.price));
    if (!(qty >= 2 && qty <= 20) || !(price > 0) || price > 10000000 || byQty.has(qty)) continue;
    const l = b.label && typeof b.label === 'object' ? b.label : {};
    const label = Object.fromEntries(['ar', 'fr', 'en'].map((k) => [k, String(l[k] ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 60)]));
    byQty.set(qty, { qty, price, label, hot: Boolean(b.hot) });
  }
  return [...byQty.values()].sort((a, b) => a.qty - b.qty).slice(0, 5);
}

export function productBundles(p) {
  return cleanBundles(p.options || '');
}

// What goes in products.options: the plain list of groups, or an object when the product has offers.
export function packOptions(groups, bundles) {
  const g = cleanOptions(groups);
  const b = cleanBundles({ bundles });
  if (b.length) return JSON.stringify({ groups: g, bundles: b });
  return g.length ? JSON.stringify(g) : '';
}

// The offers that are real discounts for this product's current price (an offer typed before a price cut is dropped).
export function liveBundles(p) {
  return productBundles(p).filter((b) => b.price < p.price * b.qty);
}

// Price of `qty` pieces: the biggest offer that fits, then any extra pieces at the normal price.
// `extra` is the per-piece price change of the chosen colour/size, added to every piece.
export function bundleTotal(bundles, base, extra, qty) {
  const unit = Math.max(0, base + extra);
  const tier = [...bundles].reverse().find((b) => b.qty <= qty && b.price < base * b.qty) || null;
  if (!tier) return { total: unit * qty, tier: null, saved: 0 };
  const total = Math.max(0, tier.price + extra * tier.qty) + (qty - tier.qty) * unit;
  return { total, tier, saved: unit * qty - total };
}

export function bundleTitle(b, lang) {
  return b.label[lang] || '';
}

const OFFER_TEXT = {
  ar: (n) => `عرض ${n} ${n <= 10 ? 'قطع' : 'قطعة'}`,
  fr: (n) => `Offre ${n} pièces`,
  en: (n) => `${n}-piece offer`,
};

// What an order line shows next to the product name: the colour/size and, when it applied, the offer.
export function lineText(line, lang) {
  const parts = [choiceText(line.choice, lang)];
  if (line.bundle) parts.push(bundleTitle(line.bundle, lang) || (OFFER_TEXT[lang] || OFFER_TEXT.fr)(line.bundle.qty));
  return parts.filter(Boolean).join(' · ');
}

// Order lines are stored with a whole-dirham price per piece. When an offer doesn't divide evenly
// (3 for 500 DH), the line is split into two rows (1 × 166 + 2 × 167) so the rows still add up exactly.
export function splitLine(total, qty) {
  const low = Math.floor(total / qty);
  const high = total - low * qty;
  return [
    { price: low, qty: qty - high },
    { price: low + 1, qty: high },
  ].filter((r) => r.qty > 0);
}

export function optionGroupName(g, lang) {
  return g.name[lang] || g.name.fr || g.name.en || g.name.ar || '';
}

// The cart keeps a choice as the picked labels joined in group order ("Rouge / M").
// Returns the matching values and the price change, or null when it isn't a valid choice.
export function resolveChoice(groups, key) {
  if (!groups.length) return { key: '', picks: [], extra: 0 };
  const parts = String(key ?? '').split(OPTION_SEP);
  if (parts.length !== groups.length) return null;
  const picks = [];
  for (let i = 0; i < groups.length; i++) {
    const v = groups[i].values.find((x) => x.label === parts[i]);
    if (!v) return null;
    picks.push({ group: groups[i], value: v });
  }
  return { key: parts.join(OPTION_SEP), picks, extra: picks.reduce((s, x) => s + x.value.price, 0) };
}

// "Couleur : Rouge · Taille : M" for orders, emails and the cart.
export function choiceText(choice, lang) {
  if (!choice) return '';
  return choice.picks
    .map(({ group, value }) => {
      const n = optionGroupName(group, lang);
      return n ? `${n}: ${value.label}` : value.label;
    })
    .join(' · ');
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
    const choice = resolveChoice(productOptions(p), item.option);
    if (!choice) {
      issues.push({ id: p.id, issue: 'option' });
      continue;
    }
    const option = choice.key;
    const unit = Math.max(0, p.price + choice.extra);
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
    const deal = bundleTotal(productBundles(p), p.price, choice.extra, qty);
    lines.push({ product: p, id: p.id, option, choice, qty, price: unit, total: deal.total, bundle: deal.tier, saved: deal.saved });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  // Delivery is included in the product prices (free delivery, cash on delivery), so nothing is added on top.
  const shipping = 0;
  return { lines, subtotal, shipping, total: subtotal + shipping, issues };
}

// Rich product descriptions (written in the admin's editor) are stored as HTML.
// Only a small allowlist of tags and attributes survives, both when saving and when showing it.
const RICH_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'figure', 'figcaption', 'hr', 'span', 'div']);
const RICH_VOID = new Set(['br', 'hr', 'img']);
const RICH_DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math', 'textarea', 'select', 'button', 'form', 'head', 'title']);
const RICH_RENAME = { b: 'strong', i: 'em', font: 'span', strike: 's', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3' };

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
    if (p === 'font-size' && /^\d(\.\d{1,3})?em$/.test(val) && parseFloat(val) >= 0.7 && parseFloat(val) <= 2.5) out.push(`font-size:${val}`);
  }
  return out.join(';');
}

// Text sizes of the editor's size menu (and of <font size>, which browsers write for it).
export const FONT_SIZES = { 1: '0.75em', 2: '0.875em', 4: '1.15em', 5: '1.35em', 6: '1.6em', 7: '2em' };

// Size the admin picked for a photo or video in the description: a width in percent (10 to 100)
// and a shape (width / height, 0.2 to 5), so it scales the same on a phone.
function mediaWidth(v) {
  const s = decodeAttr(v || '');
  const m = /(?:^|;)\s*width\s*:\s*(\d{1,3})(?:\.\d+)?%/i.exec(s);
  const n = m ? Number(m[1]) : 0;
  const r = /(?:^|;)\s*aspect-ratio\s*:\s*(\d{1,4}(?:\.\d{1,4})?)(?:\s*\/\s*(\d{1,4}(?:\.\d{1,4})?))?\s*(?:;|$)/i.exec(s);
  const ratio = r ? Number(r[1]) / (r[2] ? Number(r[2]) : 1) : 0;
  const out = [];
  if (n >= 10 && n < 100) out.push(`width:${n}%`);
  if (ratio >= 0.2 && ratio <= 5) out.push(`aspect-ratio:${Number(ratio.toFixed(3))}`);
  return out.length ? ` style="${out.join(';')}"` : '';
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
    const styles = attrs.style ? safeStyle(attrs.style).split(';').filter(Boolean) : [];
    if (attrs.align && /^(left|right|center|justify)$/i.test(attrs.align) && !styles.some((x) => x.startsWith('text-align'))) styles.push(`text-align:${attrs.align.toLowerCase()}`);
    if (raw === 'font') {
      if (attrs.color && /^#[0-9a-f]{3,8}$/i.test(attrs.color)) styles.push(`color:${attrs.color.toLowerCase()}`);
      if (FONT_SIZES[attrs.size]) styles.push(`font-size:${FONT_SIZES[attrs.size]}`);
    }
    if (styles.length && tag !== 'img' && tag !== 'video') extra += ` style="${styles.join(';')}"`;
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
      out.push(`<img src="${esc(s)}" alt="${esc(decodeAttr(attrs.alt || ''))}"${mediaWidth(attrs.style)} loading="lazy">`);
      continue;
    }
    if (tag === 'video') {
      const s = attrs.src ? safeUrl(attrs.src, true) : '';
      if (!s) {
        stack.push(['video', 'span']);
        out.push('<span>');
        continue;
      }
      out.push(`<video src="${esc(s)}${s.includes('#') ? '' : '#t=0.1'}"${mediaWidth(attrs.style)} controls playsinline preload="metadata">`);
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
