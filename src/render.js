// Server-rendered storefront pages. Every page works without JavaScript except the cart,
// checkout and add-to-cart buttons, which use public/assets/store.js.

import { T } from './i18n.js';
import { PHOTO_CREDITS } from './credits.js';
import { LOGO_ARABIC, LOGO_LATIN } from './logo.js';
import { legalDoc } from './legal.js';
import { CURRENCIES, formatPrice } from './currency.js';
import { pixelConfig } from './pixels.js';
import { CITIES, LANGS, esc, money, productName, productDesc, productImages, productOptions, richDescHtml, htmlToText } from './lib.js';

const PLACEHOLDER = '/assets/placeholder.svg';
const OG_LOCALE = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };
const DATE_LOCALE = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-MA' };

// Structured data shared by several pages.
const abs = (origin, u) => (/^https?:/.test(u) ? u : origin + u);
function breadcrumbLd(origin, items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(origin, url) })) };
}
function organizationLd(ctx) {
  const { origin, settings } = ctx;
  const sameAs = ['instagram', 'facebook', 'tiktok'].map((k) => socialUrl(k, settings[k])).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: settings.store_name || 'Shop Hani',
    url: `${origin}/`,
    logo: `${origin}/assets/brand/logo-stacked-gold.png`,
    image: `${origin}/assets/brand/og-image-v2.jpg`,
    areaServed: 'MA',
    currenciesAccepted: 'MAD',
    paymentAccepted: 'Cash',
    ...(settings.whatsapp ? { telephone: `+${settings.whatsapp}` } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
const BRAND_OG = '/assets/brand/og-image-v2.jpg';

// The drawn Shop Hani logo, or a sparkle and the plain name when the store has been renamed in admin.
function brandLogo(store, lang) {
  if (!/^shop ?hani$/i.test(store.trim()) && store.trim().toLowerCase() !== 'شوپ هاني') return `${star('logo-star')}<span>${esc(store)}</span>`;
  return lang === 'ar' ? LOGO_ARABIC : LOGO_LATIN;
}

// Line icons (24×24, stroke = currentColor).
const ICONS = {
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  truck: '<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  phone: '<path d="M6.6 3.5h2.6l1.5 4-2 1.3a11 11 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/><path d="M12 14.5v2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
};
const WA_PATH =
  'M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.8c-2 0-4-.5-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.8 10.8 0 1 1 16 26.8Zm6-8.1c-.3-.2-1.9-1-2.2-1-.3-.2-.5-.2-.7.1l-1 1.3c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.6-.5-.8-.5h-.6c-.2 0-.6 0-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.4Z';

// Brand marks for the footer's social links (filled, 24×24).
const SOCIAL = {
  instagram: '<path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.1 8c-.1-1.5-.4-2.8-1.5-3.9S17.2 2.7 15.7 2.6C14.2 2.5 9.8 2.5 8.3 2.6 6.8 2.7 5.5 3 4.4 4.1S3 6.5 2.9 8c-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.5.1-6 0-7.5Zm-2 9.4a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.4.4s-4.2.1-5.4-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.4s-.1-4.2.4-5.4a3 3 0 0 1 1.7-1.7c1.2-.5 4-.4 5.4-.4s4.2-.1 5.4.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.4s.1 4.2-.4 5.4Z"/>',
  facebook: '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
  tiktok: '<path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4s-1.9.1-3.2-1.6Z"/>',
};
const SOCIAL_NAMES = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' };

// Accepts a full URL or a bare handle ("@shophani" / "shophani").
export function socialUrl(kind, value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^https:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/[^A-Za-z0-9._-]/g, '');
  if (!handle) return '';
  return kind === 'tiktok' ? `https://www.tiktok.com/@${handle}` : `https://www.${kind}.com/${handle}`;
}

function socialLinks(settings) {
  const links = Object.keys(SOCIAL)
    .map((k) => [k, socialUrl(k, settings[k])])
    .filter(([, u]) => u)
    .map(([k, u]) => `<a href="${esc(u)}" rel="noopener me" target="_blank" aria-label="${SOCIAL_NAMES[k]}" class="social-${k}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g fill="currentColor">${SOCIAL[k]}</g></svg></a>`);
  return links.length ? `<div class="socials">${links.join('')}</div>` : '';
}

// Floating WhatsApp button: opens a small panel of ready-made messages. On a product page the
// messages mention that product; without JavaScript the button is a plain wa.me link.
function waWidget(ctx, product) {
  const { lang, settings, origin } = ctx;
  const t = T[lang];
  const number = settings.whatsapp;
  if (!waLink(number)) return '';
  const store = settings.store_name || 'Shop Hani';
  const ref = product ? `\n${product.name} — ${product.price}\n${origin}/${lang}/p/${product.slug}` : '';
  const chips = (product ? t.waChipsProduct : t.waChips).map((c) => [c, `${c}${ref}`]);
  return `<div class="wa-widget" data-wa>
  <div class="wa-panel" id="wa-panel" role="dialog" aria-labelledby="wa-title" hidden>
    <div class="wa-head">
      <span class="wa-avatar">${waIcon(22)}</span>
      <div><strong id="wa-title">${esc(store)}</strong><small><span class="wa-dot"></span>${esc(t.waReplies)}</small></div>
      <button type="button" class="wa-close" data-wa-close aria-label="${esc(t.close)}">×</button>
    </div>
    <div class="wa-body">
      <p class="wa-bubble">${esc(t.waHello)}</p>
      ${product ? `<p class="wa-product">${esc(product.name)} · <strong>${esc(product.price)}</strong></p>` : ''}
      <div class="wa-chips">${chips.map(([label, text]) => `<a href="${esc(waLink(number, text))}" rel="noopener" target="_blank">${esc(label)}</a>`).join('')}</div>
    </div>
    <a class="wa-start" href="${esc(waLink(number, product ? ref.trim() : ''))}" rel="noopener" target="_blank">${waIcon(18)} ${esc(t.waStart)}</a>
  </div>
  <a class="wa-float" href="${esc(waLink(number, product ? ref.trim() : ''))}" rel="noopener" target="_blank" aria-label="${esc(t.whatsappUs)}" aria-controls="wa-panel" aria-expanded="false" data-wa-toggle>${waIcon(28)}<span class="wa-ping" aria-hidden="true"></span></a>
</div>`;
}

function icon(name, size = 24) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
const waIcon = (size = 24) => `<svg class="icon" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${WA_PATH}"/></svg>`;
// A four-pointed sparkle, used as a small ornament (section labels, order confirmation).
const star = (cls = 'star') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z"/></svg>`;

const CUR_SIGN = { MAD: 'DH', EUR: '€', USD: '$', GBP: '£', CAD: 'C$', CHF: 'CHF', AED: 'AED', SAR: 'SAR', QAR: 'QAR', KWD: 'KWD' };

// Footer currency menu (works without JavaScript: the form posts to /currency, which sets a cookie and comes back).
function currencyPicker(ctx, path) {
  if (ctx.settings.auto_currency === '0') return '';
  const t = T[ctx.lang];
  const cur = ctx.cur || 'MAD';
  const opts = CURRENCIES.map((c) => `<option value="${c}"${c === cur ? ' selected' : ''}>${c} · ${esc(CUR_SIGN[c])}</option>`).join('');
  const credit = cur === 'MAD' ? '' : `<a class="fx-credit" href="https://www.exchangerate-api.com" rel="noopener">Rates By Exchange Rate API</a>`;
  return `<form class="cur-form" action="/currency" method="get"><input type="hidden" name="r" value="/${ctx.lang}${esc(path)}"><label><span>${esc(t.currency)}</span><select name="c" data-cur>${opts}</select></label><noscript><button class="link-btn">OK</button></noscript>${credit}</form>`;
}

// A MAD amount in the visitor's currency.
const price = (ctx, amount) => formatPrice(amount, ctx.lang, ctx.cur, ctx.rates);

function catName(c, lang) {
  return c[`name_${lang}`] || c.name_fr || c.name_en || c.name_ar || c.slug;
}

function waLink(number, text) {
  const n = String(number || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
}

// Our own photos come in a large (1000×1250) and a small (480×600) version.
function small(url) {
  return /^\/assets\/photos\/[a-z0-9-]+\.webp$/.test(url) && !url.endsWith('-sm.webp') ? url.replace(/\.webp$/, '-sm.webp') : url;
}
function srcset(url) {
  const s = small(url);
  return s !== url ? ` srcset="${esc(s)} 480w, ${esc(url)} 1000w"` : '';
}

export function layout(ctx, { title, seoTitle = '', description = '', path, body, noindex = false, image = '', page = '', product = null, track = null, ld = [], ogType = 'website' }) {
  const { lang, settings, origin, categories = [] } = ctx;
  const t = T[lang];
  const px = pixelConfig(settings);
  const pixels = px.meta || px.tiktok;
  const store = settings.store_name || 'Shop Hani';
  // Search titles carry the keywords: "<page> · <keywords> | Shop Hani", or "Shop Hani · <keywords>" on the home page.
  const fullTitle = seoTitle ? `${seoTitle} | ${store}` : title ? `${title} · ${store}` : `${store} · ${t.seoTitle}`;
  const metaDesc = description || t.seoDesc;
  const pageUrl = `${origin}/${lang}${path}`;
  const verify = String(settings.google_verify || '').match(/content=["']?([\w-]{10,100})/)?.[1] || (/^[\w-]{10,100}$/.test(String(settings.google_verify || '').trim()) ? String(settings.google_verify).trim() : '');
  const ldTags = ld.filter(Boolean).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  const announcement = settings[`announcement_${lang}`] || '';
  const wa = waLink(settings.whatsapp);
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(origin)}/${l}${esc(path)}">`).join('');
  const langLinks = LANGS.map(
    (l) => `<a href="/${l}${esc(path)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l === 'ar' ? 'عربية' : l.toUpperCase()}</a>`,
  ).join('');
  const navCats = categories.map((c) => `<a href="/${lang}/c/${esc(c.slug)}">${esc(catName(c, lang))}</a>`).join('');
  const og = image || BRAND_OG;
  const ogImage = og.startsWith('http') ? og : `${origin}${og}`;
  const fonts =
    lang === 'ar'
      ? 'family=Alexandria:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700'
      : 'family=Outfit:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800';
  const tickerItems = [announcement, t.cod, t.delivery, t.confirm].filter(Boolean);
  const ticker = tickerItems.map((s) => `<span>${star('tick-star')}${esc(s)}</span>`).join('');
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(metaDesc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(origin)}/${lang}${esc(path)}">${alternates}<link rel="alternate" hreflang="x-default" href="${esc(origin)}/fr${esc(path)}">`}
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:type" content="${ogType}">
${noindex ? '' : `<meta property="og:url" content="${esc(pageUrl)}">`}<meta property="og:locale" content="${OG_LOCALE[lang]}">${LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`).join('')}
${verify ? `<meta name="google-site-verification" content="${esc(verify)}">` : ''}${ldTags}
<meta property="og:site_name" content="${esc(store)}">
<meta property="og:image" content="${esc(ogImage)}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2b50ee">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/favicon.svg?v=4" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=14">
<script src="/assets/js-on.js"></script>
${pixels ? `<script type="application/json" id="pixels">${JSON.stringify({ ...px, page: track }).replace(/</g, '\\u003c')}</script>
<script src="/assets/pixels.js?v=1" defer></script>` : ''}
<script src="/assets/store.js?v=10" defer></script>
</head>
<body data-lang="${lang}" class="page-${page || 'default'}">
<a class="skip" href="#main">${esc(t.allProducts)}</a>
<div class="ticker" aria-label="${esc(announcement || t.cod)}"><div class="ticker-track">${ticker}${ticker}</div></div>
<header class="top">
  <div class="wrap top-row">
    <a class="logo" href="/${lang}/" aria-label="${esc(store)}">${brandLogo(store, lang)}</a>
    <nav class="main-nav" aria-label="${esc(t.categories)}"><a href="/${lang}/shop">${esc(t.shop)}</a>${navCats}<a href="/${lang}/blog">${esc(t.blog)}</a></nav>
    <div class="top-actions">
      <form class="top-search" action="/${lang}/shop" method="get" role="search"><input type="search" name="q" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"><button aria-label="${esc(t.search)}">${icon('search', 20)}</button></form>
      <span class="langs">${langLinks}</span>
      <a class="cart-link" href="/${lang}/cart" aria-label="${esc(t.cart)}">${icon('cart')}<span class="cart-count" hidden>0</span></a>
    </div>
  </div>
  ${categories.length ? `<nav class="chips" aria-label="${esc(t.categories)}"><a class="chip" href="/${lang}/shop">${esc(t.allProducts)}</a>${categories.map((c) => `<a class="chip" href="/${lang}/c/${esc(c.slug)}">${esc(catName(c, lang))}</a>`).join('')}</nav>` : ''}
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="foot-band" aria-hidden="true"></div>
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a class="logo logo-light" href="/${lang}/" aria-label="${esc(store)}">${brandLogo(store, lang)}</a>
      <p>${esc(t.tagline)}</p>
      ${socialLinks(settings)}
    </div>
    <div>
      <h3>${esc(t.shop)}</h3>
      <ul><li><a href="/${lang}/shop">${esc(t.allProducts)}</a></li>${categories.map((c) => `<li><a href="/${lang}/c/${esc(c.slug)}">${esc(catName(c, lang))}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h3>${esc(t.help)}</h3>
      <ul>
        <li><a href="/${lang}/about">${esc(t.aboutUs)}</a></li>
        <li><a href="/${lang}/blog">${esc(t.blog)}</a></li>
        <li>${esc(t.deliveryLong)}</li>
        <li>${esc(t.confirm)}</li>
        ${wa ? `<li><a href="${esc(wa)}" rel="noopener">${esc(t.whatsappUs)}</a></li>` : ''}
        ${settings.contact_email ? `<li><a href="mailto:${esc(settings.contact_email)}">${esc(settings.contact_email)}</a></li>` : ''}
        <li><a href="/${lang}/terms">${esc(t.terms)}</a></li>
        <li><a href="/${lang}/privacy">${esc(t.privacy)}</a></li>
        <li><a href="/${lang}/credits">${esc(t.credits)}</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap foot-pay" aria-label="${esc(t.weAccept)}">
    <span class="pay-badge">${icon('cash', 18)} ${esc(t.cod)}</span>
    <span class="pay-badge">${icon('truck', 18)} ${esc(t.delivery)}</span>
    <span class="pay-badge">${icon('undo', 18)} ${esc(t.returns)}</span>
    <span class="pay-badge">${icon('lock', 18)} ${esc(t.secure)}</span>
  </div>
  <div class="wrap foot-bottom"><span>© ${new Date().getUTCFullYear()} ${esc(store)}. ${esc(t.rights)}</span>${pixels ? `<button type="button" class="link-btn" data-consent-open>${esc(t.cookieSettings)}</button>` : ''}${currencyPicker(ctx, path)}<span class="langs">${langLinks}</span></div>
</footer>
<nav class="tabbar" aria-label="${esc(t.shop)}">
  <a href="/${lang}/"${page === 'home' ? ' aria-current="page"' : ''}>${icon('home')}<span>${esc(t.home)}</span></a>
  <a href="/${lang}/shop"${page === 'shop' ? ' aria-current="page"' : ''}>${icon('grid')}<span>${esc(t.shop)}</span></a>
  <a href="/${lang}/cart"${page === 'cart' ? ' aria-current="page"' : ''} class="tab-cart">${icon('cart')}<span>${esc(t.cart)}</span><span class="cart-count" hidden>0</span></a>
  <a href="/${lang}/shop#q"${page === 'search' ? ' aria-current="page"' : ''} data-search-tab>${icon('search')}<span>${esc(t.searchTab)}</span></a>
</nav>
${waWidget(ctx, product)}
<div class="toast" role="status" aria-live="polite" hidden></div>
${pixels ? `<div class="consent-bar" id="consent" role="dialog" aria-label="${esc(t.cookieSettings)}" hidden><p>${esc(t.consentAds)} <a href="/${lang}/privacy#s7">${esc(t.privacy)}</a></p><div><button type="button" class="btn btn-outline" data-consent="no">${esc(t.refuse)}</button><button type="button" class="btn" data-consent="yes">${esc(t.accept)}</button></div></div>` : ''}
<script type="application/json" id="i18n">${JSON.stringify({ ...t.js, lang, cur: ctx.cur || 'MAD', rate: ctx.rates?.[ctx.cur] || 1 }).replace(/</g, '\\u003c')}</script>
</body>
</html>`;
}

export function productCard(p, ctx, i = 0) {
  const { lang } = ctx;
  const t = T[lang];
  const imgs = productImages(p);
  const img = imgs[0] || PLACEHOLDER;
  const name = productName(p, lang);
  const soldOut = p.stock != null && p.stock <= 0;
  const onSale = p.compare_price && p.compare_price > p.price;
  const off = onSale ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  const quickAdd = !soldOut && !productOptions(p).length;
  return `<article class="card reveal" style="--d:${(i % 4) * 70}ms">
  <a href="/${lang}/p/${esc(p.slug)}" class="card-img">
    <img src="${esc(small(img))}"${srcset(img)} sizes="(min-width: 900px) 25vw, 50vw" alt="${esc(name)}" loading="lazy" width="480" height="600">
    ${imgs[1] ? `<img class="alt" src="${esc(small(imgs[1]))}" alt="" loading="lazy" width="480" height="600">` : ''}
    ${soldOut ? `<span class="badge muted">${esc(t.outOfStock)}</span>` : onSale ? `<span class="badge">−${off}%</span>` : ''}
  </a>
  ${quickAdd ? `<button class="quick-add" type="button" data-add="${p.id}" data-name="${esc(name)}" data-price="${p.price}" data-image="${esc(img)}" data-slug="${esc(p.slug)}" aria-label="${esc(t.addToCart)}: ${esc(name)}">${icon('plus', 20)}</button>` : ''}
  <div class="card-body">
    <h3><a href="/${lang}/p/${esc(p.slug)}">${esc(name)}</a></h3>
    <p class="price">${esc(price(ctx, p.price))}${onSale ? ` <s>${esc(price(ctx, p.compare_price))}</s>` : ''}</p>
  </div>
</article>`;
}

function grid(products, ctx, emptyText) {
  return products.length
    ? `<div class="grid">${products.map((p, i) => productCard(p, ctx, i)).join('')}</div>`
    : `<p class="empty">${esc(emptyText)}</p>`;
}

function trust(lang, cls = '') {
  const t = T[lang];
  const item = (ic, title, text) => `<li>${icon(ic, 28)}<div><strong>${esc(title)}</strong><span>${esc(text)}</span></div></li>`;
  return `<ul class="trust ${cls}">
  ${item('cash', t.cod, t.codText)}
  ${item('truck', t.delivery, t.deliveryText)}
  ${item('phone', t.confirm, t.confirmText)}
</ul>`;
}

function descMedia(p) {
  try {
    const arr = JSON.parse(p.desc_media || '[]');
    return Array.isArray(arr) ? arr.filter((m) => m && typeof m.url === 'string' && (m.url.startsWith('/img/') || m.url.startsWith('https://'))) : [];
  } catch {
    return [];
  }
}

function sectionHead(title, kicker = '', link = '', linkText = '') {
  return `<div class="section-head reveal">${kicker ? `<p class="kicker">${star('tick-star')}${esc(kicker)}</p>` : ''}<h2>${esc(title)}</h2>${link ? `<a class="more" href="${esc(link)}">${esc(linkText)} ${icon('arrow', 18)}</a>` : ''}</div>`;
}

const HERO_PHOTOS = ['hero-shopping', 'hero-tech', 'hero-home'];

export function homePage(ctx, featured, latest) {
  const { lang, categories, settings } = ctx;
  const t = T[lang];
  const hasCat = (slug) => categories.some((c) => c.slug === slug);
  const slideLinks = [`/${lang}/shop`, hasCat('high-tech') ? `/${lang}/c/high-tech` : `/${lang}/shop`, hasCat('maison') ? `/${lang}/c/maison` : `/${lang}/shop`];
  const slides = t.slides
    .map((s, i) => {
      const title = i === 0 ? settings[`hero_title_${lang}`] || s.title : s.title;
      const text = i === 0 ? settings[`hero_text_${lang}`] || s.text : s.text;
      const photo = HERO_PHOTOS[i];
      return `<div class="slide${i === 0 ? ' on' : ''}" aria-roledescription="slide" aria-label="${i + 1} / ${t.slides.length}"${i ? ' aria-hidden="true"' : ''}>
      <picture>
        <source media="(min-width: 760px)" srcset="/assets/photos/${photo}-hero.webp">
        <img src="/assets/photos/${photo}.webp" alt="" width="1000" height="1250"${i ? ' loading="lazy"' : ' fetchpriority="high"'}>
      </picture>
      <div class="slide-text wrap">
        <p class="kicker">${star('tick-star')}${esc(s.kicker)}</p>
        ${i === 0 ? `<h1>${esc(title)}</h1>` : `<p class="h1">${esc(title)}</p>`}
        <p class="lead">${esc(text)}</p>
        <a class="btn btn-gold" href="${slideLinks[i]}" tabindex="${i ? -1 : 0}">${esc(s.cta)} ${icon('arrow', 20)}</a>
      </div>
    </div>`;
    })
    .join('');
  const cats = categories.length
    ? `<section class="section wrap">${sectionHead(t.shopByCategory, t.categories)}
    <div class="arches">${categories
      .map(
        (c, i) => `<a class="arch reveal" style="--d:${i * 90}ms" href="/${lang}/c/${esc(c.slug)}">
        <span class="arch-img"><img src="${esc(small(c.image || PLACEHOLDER))}" alt="" loading="lazy" width="480" height="600"></span>
        <span class="arch-name">${esc(catName(c, lang))}</span></a>`,
      )
      .join('')}</div></section>`
    : '';
  const body = `<section class="hero" aria-roledescription="carousel" aria-label="${esc(t.tagline)}">
  ${slides}
  <div class="hero-dots wrap" role="tablist">${t.slides.map((_, i) => `<button type="button" role="tab" aria-label="${i + 1}"${i === 0 ? ' aria-selected="true"' : ''}><span></span></button>`).join('')}</div>
</section>
<div class="wrap trust-wrap">${trust(lang, 'trust-float')}</div>
${cats}
${featured.length ? `<section class="section wrap">${sectionHead(t.featured, t.shop, `/${lang}/shop`, t.viewAll)}${grid(featured, ctx, t.noProducts)}</section>` : ''}
<section class="story">
  <div class="wrap story-grid">
    <div class="story-img reveal"><img src="/assets/photos/delivery.webp" alt="" loading="lazy" width="1000" height="1250"></div>
    <div class="story-text reveal" style="--d:120ms">
      <p class="kicker">${star('tick-star')}${esc(t.storyKicker)}</p>
      <h2>${esc(t.storyTitle)}</h2>
      <p>${esc(t.storyText)}</p>
      <a class="btn btn-outline-light" href="/${lang}/shop">${esc(t.storyCta)} ${icon('arrow', 20)}</a>
    </div>
  </div>
</section>
${latest.length ? `<section class="section wrap">${sectionHead(t.newArrivals, t.shop, `/${lang}/shop`, t.viewAll)}${grid(latest, ctx, t.noProducts)}</section>` : ''}
<section class="banner reveal">
  <img src="/assets/photos/kitchen-wide.webp" alt="" loading="lazy" width="1800" height="900">
  <div class="banner-text wrap">
    <p class="kicker">${star('tick-star')}${esc(t.bannerKicker)}</p>
    <h2>${esc(t.bannerTitle)}</h2>
    <p>${esc(t.bannerText)}</p>
    <a class="btn btn-gold" href="${hasCat('maison') ? `/${lang}/c/maison` : `/${lang}/shop`}">${esc(t.bannerCta)} ${icon('arrow', 20)}</a>
  </div>
</section>
<section class="section wrap how">
  ${sectionHead(t.howTitle)}
  <ol class="steps">${t.steps.map((s, i) => `<li class="reveal" style="--d:${i * 110}ms"><span class="step-n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>
</section>`;
  const seo = t.homeSeo;
  const seoBlock = `<section class="section wrap seo-block">
  <div class="seo-grid">
    <div class="seo-text reveal"><h2>${esc(seo.title)}</h2>${seo.paras.map((x) => `<p>${x}</p>`).join('')}
      <h3>${esc(seo.citiesTitle)}</h3><p class="cities">${CITIES.map(esc).join(' · ')}</p></div>
    <div class="seo-faq reveal"><h2>${esc(seo.faqTitle)}</h2><div class="accordion">${seo.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('')}</div></div>
  </div>
</section>`;
  const ld = [
    organizationLd(ctx),
    { '@context': 'https://schema.org', '@type': 'WebSite', name: settings.store_name || 'Shop Hani', url: `${ctx.origin}/${lang}/`, inLanguage: lang, potentialAction: { '@type': 'SearchAction', target: `${ctx.origin}/${lang}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: seo.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return layout(ctx, { title: '', path: '/', body: body + seoBlock, image: BRAND_OG, page: 'home', ld });
}

export function listingPage(ctx, { title, path, products, q = '', sort = '', description = '', image = '', seoTitle = '', metaDescription = '' }) {
  const { lang } = ctx;
  const t = T[lang];
  const sortOpts = [
    ['', t.sortNew],
    ['price_asc', t.sortPriceAsc],
    ['price_desc', t.sortPriceDesc],
  ];
  const body = `<section class="page-hero${image ? ' has-img' : ''}">
  ${image ? `<img src="${esc(image)}" alt="" width="1000" height="1250">` : ''}
  <div class="wrap"><p class="kicker">${star('tick-star')}${esc(t.shop)}</p><h1>${esc(title)}</h1>${description ? `<p class="lead">${esc(description)}</p>` : ''}</div>
</section>
<section class="wrap section listing">
  <form class="filters" action="/${lang}${esc(path)}" method="get">
    <label class="search">${icon('search', 20)}<input id="q" type="search" name="q" enterkeyhint="search" value="${esc(q)}" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}"></label>
    <label class="sort"><span>${esc(t.sort)}</span><select name="sort" data-autosubmit>${sortOpts.map(([v, l]) => `<option value="${v}"${v === sort ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
    <noscript><button class="btn btn-small">OK</button></noscript>
  </form>
  <p class="count">${esc(t.productsCount(products.length))}</p>
  ${grid(products, ctx, q ? t.noResults : t.noProducts)}
</section>`;
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (sort) query.set('sort', sort);
  const ld = [
    breadcrumbLd(ctx.origin, [[t.home, `/${lang}/`], [title, `/${lang}${path}`]]),
    products.length ? { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: products.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ctx.origin}/${lang}/p/${p.slug}`, name: productName(p, lang) })) } : null,
  ];
  return layout(ctx, { title, seoTitle, description: metaDescription, path: query.size ? `${path}?${query}` : path, body, noindex: Boolean(q || sort), image, page: 'shop', ld });
}

export function productPage(ctx, p, category, related) {
  const { lang, origin, settings } = ctx;
  const t = T[lang];
  const name = productName(p, lang);
  const descRaw = productDesc(p, lang);
  const desc = htmlToText(descRaw);
  const media = descMedia(p);
  const images = productImages(p);
  if (!images.length) images.push(PLACEHOLDER);
  const options = productOptions(p);
  const soldOut = p.stock != null && p.stock <= 0;
  const onSale = p.compare_price && p.compare_price > p.price;
  const freeShip = true; // delivery is included in every price
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: desc,
    image: images.map((u) => (u.startsWith('http') ? u : origin + u)),
    sku: String(p.id),
    offers: {
      '@type': 'Offer',
      price: String(p.price),
      priceCurrency: 'MAD',
      availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `${origin}/${lang}/p/${p.slug}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: settings.store_name || 'Shop Hani' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'MAD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'MA' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' } },
      },
      hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'MA', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 7, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/FreeReturn' },
    },
    brand: { '@type': 'Brand', name: settings.store_name || 'Shop Hani' },
    ...(category ? { category: catName(category, lang) } : {}),
  };
  const wa = waLink(settings.whatsapp, `${name} — ${money(p.price, lang)}\n${origin}/${lang}/p/${p.slug}`);
  const stockLine = soldOut ? '' : p.stock != null && p.stock <= 5 ? `<p class="stock stock-low"><span class="dot"></span>${esc(t.onlyLeft(p.stock))}</p>` : `<p class="stock"><span class="dot"></span>${esc(t.inStock)}</p>`;
  const body = `<nav class="crumbs wrap" aria-label="breadcrumb"><a href="/${lang}/">${esc(t.home)}</a><span>/</span>${category ? `<a href="/${lang}/c/${esc(category.slug)}">${esc(catName(category, lang))}</a><span>/</span>` : ''}<span aria-current="page">${esc(name)}</span></nav>
<section class="wrap product">
  <div class="gallery" aria-label="${esc(name)}">
    <div class="gallery-track">${images.map((u, i) => `<img src="${esc(u)}" alt="${esc(name)}${i ? ` ${i + 1}` : ''}" width="1000" height="1250"${i ? ' loading="lazy"' : ' fetchpriority="high"'}>`).join('')}</div>
    ${images.length > 1 ? `<div class="thumbs">${images.map((u, i) => `<button type="button" data-go="${i}"${i === 0 ? ' class="on"' : ''} aria-label="${i + 1}"><img src="${esc(small(u))}" alt="" width="96" height="120" loading="lazy"></button>`).join('')}</div>` : ''}
  </div>
  <div class="product-info">
    ${category ? `<p class="kicker">${star('tick-star')}${esc(catName(category, lang))}</p>` : ''}
    <h1>${esc(name)}</h1>
    <p class="price big">${esc(price(ctx, p.price))}${onSale ? ` <s>${esc(price(ctx, p.compare_price))}</s> <span class="save">−${Math.round((1 - p.price / p.compare_price) * 100)}%</span>` : ''}</p>
    ${ctx.cur && ctx.cur !== 'MAD' ? `<p class="price-mad">${esc(t.paidInMad(money(p.price, lang)))}</p>` : ''}
    ${freeShip && !soldOut ? `<p class="free-ship">${icon('truck', 20)}<span>${esc(t.finalPrice)}</span></p>` : ''}
    ${onSale ? `<p class="you-save">${esc(t.youSave(price(ctx, p.compare_price - p.price)))}</p>` : ''}
    ${stockLine}
    ${soldOut ? '' : `<div class="eta">${icon('truck', 22)}<div><strong>${esc(t.deliveryLong)}</strong><span data-eta hidden></span></div></div>`}
    <form class="buy" novalidate data-product="${p.id}" data-name="${esc(name)}" data-price="${p.price}" data-image="${esc(images[0])}" data-slug="${esc(p.slug)}">
      ${options.length ? `<fieldset class="options"><legend>${esc(t.choose)}</legend><div>${options.map((o, i) => `<label><input type="radio" name="option" value="${esc(o)}"${i === 0 && options.length === 1 ? ' checked' : ''} required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>` : ''}
      <div class="qty-row">
        <label for="qty">${esc(t.quantity)}</label>
        <div class="qty"><button type="button" data-step="-1" aria-label="−">−</button><input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${p.stock != null ? Math.max(1, Math.min(20, p.stock)) : 20}" value="1"><button type="button" data-step="1" aria-label="+">+</button></div>
      </div>
      ${soldOut ? `<button class="btn btn-block" type="button" disabled>${esc(t.outOfStock)}</button>` : `<div class="quick" id="order">
        <p class="quick-lead">${esc(t.quickText)}<span class="finger" aria-hidden="true">👇</span></p>
        <div class="quick-fields">
          <label class="qf">${icon('user', 20)}<input name="name" autocomplete="name" required maxlength="80" placeholder="${esc(t.fullName)}" aria-label="${esc(t.fullName)}"></label>
          <label class="qf">${icon('pin', 20)}<select name="city" required aria-label="${esc(t.city)}"><option value="">${esc(t.chooseCity)}</option>${CITIES.map((c) => `<option>${esc(c)}</option>`).join('')}<option value="__other">${esc(t.otherCity)}</option></select></label>
          <label class="qf other-city" hidden>${icon('pin', 20)}<input name="city_other" maxlength="60" placeholder="${esc(t.otherCity)}" aria-label="${esc(t.otherCity)}"></label>
          <label class="qf">${icon('home', 20)}<input name="address" required maxlength="300" autocomplete="street-address" placeholder="${esc(t.address)}" aria-label="${esc(t.address)}"></label>
          <label class="qf">${icon('phone', 20)}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" dir="ltr" placeholder="${esc(t.phone)} · ${esc(t.phoneHint)}" aria-label="${esc(t.phone)}"></label>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        </div>
        <ul class="quick-sum" data-quick-sum>
          <li><span>${esc(t.quickItems)}</span><span data-q-sub>${esc(price(ctx, p.price))}</span></li>
          <li><span>${esc(t.quickShipping)}</span><span data-q-ship${freeShip ? ' class="free"' : ''}>${esc(freeShip ? t.freeDelivery : t.quickShipAfter)}</span></li>
          <li class="total"><span>${esc(t.quickTotal)}</span><span data-q-total>${esc(price(ctx, p.price))}</span></li>
        </ul>
        <button class="btn btn-block btn-accent btn-lg quick-go" type="submit" name="go" value="order">${icon('check', 22)}<span>${esc(t.buyNow)}</span></button>
        <p class="form-error" role="alert" hidden></p>
        <p class="quick-note">${icon('lock', 16)} ${esc(t.payOnDelivery)}</p>
        <p class="consent">${t.consent(`/${lang}/terms`, `/${lang}/privacy`)}</p>
      </div>
      <button class="btn btn-block btn-outline" type="submit" name="go" value="cart">${icon('cart', 20)} ${esc(t.addToCart)}</button>`}
    </form>
    <ul class="perks">
      <li>${icon('cash', 22)}<span><strong>${esc(t.cod)}</strong>${esc(t.codText)}</span></li>
      <li>${icon('phone', 22)}<span><strong>${esc(t.confirm)}</strong>${esc(t.confirmText)}</span></li>
      <li>${icon('undo', 22)}<span><strong>${esc(t.returns)}</strong>${esc(t.returnsText)}</span></li>
      <li>${icon('lock', 22)}<span><strong>${esc(t.secure)}</strong>${esc(t.secureText)}</span></li>
    </ul>
    <div class="accordion">
      ${descRaw || media.length ? `<details open><summary>${esc(t.details)}</summary><div>${descRaw ? `<div class="rich">${richDescHtml(descRaw)}</div>` : ''}${media.length ? `<div class="desc-media">${media.map((m) => (m.type === 'video' ? `<video src="${esc(m.url)}#t=0.1" controls playsinline preload="metadata"></video>` : `<img src="${esc(m.url)}" alt="${esc(name)}" loading="lazy">`)).join('')}</div>` : ''}</div></details>` : ''}
      <details><summary>${esc(t.shippingPayment)}</summary><div>${esc(t.shippingPaymentText)}</div></details>
      <details><summary>${esc(t.returns)}</summary><div>${esc(t.returnsLong)} <a href="/${lang}/terms">${esc(t.terms)}</a></div></details>
    </div>
    <div class="share-row">
      ${wa ? `<a class="wa-inline" href="${esc(wa)}" rel="noopener">${waIcon(20)} ${esc(t.whatsappUs)}</a>` : ''}
      <span class="share-btns"><span>${esc(t.share)}</span>
        <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent(`${name} — ${origin}/${lang}/p/${p.slug}`)}" rel="noopener" target="_blank" aria-label="${esc(t.shareWa)}">${waIcon(18)}</a>
        <button class="share-btn" type="button" data-copy="${esc(`${origin}/${lang}/p/${p.slug}`)}" aria-label="${esc(t.copyLink)}">${icon('link', 18)}</button>
      </span>
    </div>
  </div>
</section>
${soldOut ? '' : `<div class="buy-bar" aria-hidden="true"><div><strong>${esc(price(ctx, p.price))}</strong><small>${esc(freeShip ? t.freeDelivery : t.cod)}</small></div><a class="btn btn-accent" href="#order" data-buy-now>${esc(t.buyNow)}</a></div>`}
${related.length ? `<section class="section wrap">${sectionHead(t.alsoLike, category ? catName(category, lang) : t.shop, category ? `/${lang}/c/${category.slug}` : `/${lang}/shop`, t.viewAll)}${grid(related, ctx, '')}</section>` : ''}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  const crumbs = [[t.home, `/${lang}/`], ...(category ? [[catName(category, lang), `/${lang}/c/${category.slug}`]] : []), [name, `/${lang}/p/${p.slug}`]];
  return layout(ctx, { title: name, seoTitle: t.productSeoTitle(name), description: desc.length >= 70 ? desc.slice(0, 158) : t.productSeoDesc(name, money(p.price, lang)), ld: [breadcrumbLd(origin, crumbs)], path: `/p/${p.slug}`, body, image: images[0], page: 'product', product: { name, price: money(p.price, lang), slug: p.slug }, track: { event: 'ViewContent', value: p.price, items: [{ id: p.id, name, price: p.price, qty: 1 }] } });
}

function stepsBar(lang, current) {
  const t = T[lang];
  return `<ol class="checkout-steps">${[t.stepCart, t.stepDelivery, t.stepDone].map((s, i) => `<li${i === current ? ' aria-current="step"' : ''}${i < current ? ' class="done"' : ''}><span>${i < current ? icon('check', 16) : i + 1}</span>${esc(s)}</li>`).join('')}</ol>`;
}

export function cartPage(ctx) {
  const { lang } = ctx;
  const t = T[lang];
  const body = `<section class="wrap section narrow">
  ${stepsBar(lang, 0)}
  <h1>${esc(t.cart)}</h1>
  <div id="cart" class="cart" data-view="cart"><div class="skeleton"></div><div class="skeleton"></div></div>
  <noscript><p>JavaScript is required for the cart.</p></noscript>
</section>`;
  return layout(ctx, { title: t.cart, path: '/cart', body, noindex: true, page: 'cart' });
}

export function checkoutPage(ctx) {
  const { lang } = ctx;
  const t = T[lang];
  const cities = CITIES.map((c) => `<option>${esc(c)}</option>`).join('');
  const body = `<section class="wrap section">
  ${stepsBar(lang, 1)}
  <h1 class="center">${esc(t.checkout)}</h1>
  <form id="checkout" class="checkout" novalidate>
    <div class="form card-box">
      <h2>${esc(t.yourDetails)}</h2>
      <label>${esc(t.fullName)}<input name="name" autocomplete="name" required maxlength="80"></label>
      <label>${esc(t.city)}<select name="city" required><option value="">${esc(t.chooseCity)}</option>${cities}<option value="__other">${esc(t.otherCity)}</option></select></label>
      <label class="other-city" hidden>${esc(t.otherCity)}<input name="city_other" maxlength="60"></label>
      <label>${esc(t.address)}<textarea name="address" rows="2" placeholder="${esc(t.addressHint)}" required maxlength="300"></textarea></label>
      <label>${esc(t.phone)}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(t.phoneHint)}" required maxlength="20" dir="ltr"></label>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    </div>
    <aside class="summary card-box">
      <h2>${esc(t.yourOrder)}</h2>
      <div id="cart" data-view="summary"><div class="skeleton"></div></div>
      <p class="cod-note">${icon('cash', 22)} ${esc(t.payOnDelivery)}</p>
      <button class="btn btn-block btn-accent btn-lg" type="submit">${esc(t.placeOrder)}</button>
      <p class="consent">${t.consent(`/${lang}/terms`, `/${lang}/privacy`)}</p>
      <p class="form-error" role="alert" hidden></p>
    </aside>
  </form>
</section>`;
  return layout(ctx, { title: t.checkout, path: '/checkout', body, noindex: true, page: 'checkout' });
}

export function orderPage(ctx, order, items) {
  const { lang, settings } = ctx;
  const t = T[lang];
  const wa = waLink(settings.whatsapp, `${t.orderNumber}: ${order.number}`);
  const flow = ['new', 'confirmed', 'shipped', 'delivered'];
  const at = flow.indexOf(order.status);
  const timeline =
    at >= 0
      ? `<ol class="timeline">${flow.map((s, i) => `<li class="${i <= at ? 'done' : ''}"><span>${i <= at ? icon('check', 14) : ''}</span>${esc(t.status[s])}</li>`).join('')}</ol>`
      : `<p class="center"><strong>${esc(t.status[order.status] || order.status)}</strong></p>`;
  const body = `<section class="wrap section narrow">
  ${stepsBar(lang, 2)}
  <div class="thanks">
    <div class="check-burst" aria-hidden="true">${star('burst-star')}<span>${icon('check', 40)}</span></div>
    <h1>${esc(t.thanks)}</h1>
    <p class="lead">${esc(t.thanksText)}</p>
  </div>
  ${timeline}
  <div class="card-box">
    <dl class="order-meta">
      <div><dt>${esc(t.orderNumber)}</dt><dd dir="ltr">${esc(order.number)}</dd></div>
      <div><dt>${esc(t.deliverTo)}</dt><dd>${esc(order.name)}, ${esc(order.city)}</dd></div>
    </dl>
    <ul class="lines">${items.map((i) => `<li><span>${esc(i.name)}${i.option ? ` · ${esc(i.option)}` : ''} × ${i.qty}</span><span>${esc(money(i.price * i.qty, lang))}</span></li>`).join('')}</ul>
    <ul class="totals">
      <li><span>${esc(t.js.shipping)}</span><span>${order.shipping ? esc(money(order.shipping, lang)) : esc(t.js.free)}</span></li>
      <li class="total"><span>${esc(t.js.total)}</span><span>${esc(money(order.total, lang))}</span></li>
    </ul>
    <p class="cod-note">${icon('cash', 22)} ${esc(t.payOnDelivery)}</p>
  </div>
  <p class="center actions"><a class="btn btn-outline" href="/${lang}/shop">${esc(t.continueShopping)}</a>${wa ? ` <a class="btn btn-wa" href="${esc(wa)}" rel="noopener">${waIcon(20)} ${esc(t.whatsappUs)}</a>` : ''}</p>
</section>`;
  return layout(ctx, { title: t.thanks, path: '/', body, noindex: true, page: 'order', track: { event: 'Purchase', id: order.number, value: order.total, items: items.map((i) => ({ id: i.product_id, name: i.name, price: i.price, qty: i.qty })) } });
}

export function creditsPage(ctx) {
  const t = T[ctx.lang];
  const body = `<section class="wrap section narrow">
  <h1>${esc(t.credits)}</h1>
  <p>${esc(t.creditsText)}</p>
  <ul class="credits">${PHOTO_CREDITS.map((c) => `<li><img src="/assets/photos/${esc(c.file)}-sm.webp" alt="" width="60" height="75" loading="lazy"><span>${esc(t.photoBy)}${ctx.lang === 'fr' ? '\u202f' : ''}: <strong>${esc(c.photographer)}</strong> · <a href="${esc(c.url)}" rel="noopener">Unsplash</a></span></li>`).join('')}</ul>
  <p><a href="https://unsplash.com/license" rel="noopener">Unsplash License</a></p>
</section>`;
  return layout(ctx, { title: t.credits, path: '/credits', body });
}

export function legalPage(ctx, kind) {
  const { lang, settings } = ctx;
  const t = T[lang];
  const doc = legalDoc(kind, lang, settings);
  const body = `<section class="wrap section narrow legal">
  <h1>${esc(doc.title)}</h1>
  <p class="legal-updated">${esc(t.updated)} <time datetime="${doc.updated}">${esc(new Date(doc.updated + 'T12:00:00Z').toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-MA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }))}</time></p>
  ${['legal_name', 'legal_ice', 'legal_address'].some((k) => !settings[k]) ? `<p class="legal-draft" role="note">${esc(doc.draft)}</p>` : ''}
  <nav class="legal-toc" aria-label="${esc(doc.title)}"><ol>${doc.sections.map(([h], i) => `<li><a href="#s${i + 1}">${esc(h)}</a></li>`).join('')}</ol></nav>
  ${doc.sections.map(([h, html], i) => `<section id="s${i + 1}"><h2>${esc(h)}</h2>${html}</section>`).join('\n  ')}
  <p class="legal-switch"><a href="/${lang}/${kind === 'privacy' ? 'terms' : 'privacy'}">${esc(kind === 'privacy' ? t.terms : t.privacy)} →</a></p>
</section>`;
  return layout(ctx, { title: doc.title, description: doc.title, path: `/${kind}`, body, page: 'legal' });
}

export function aboutPage(ctx) {
  const { lang, settings } = ctx;
  const t = T[lang];
  const a = t.aboutPage;
  const store = settings.store_name || 'Shop Hani';
  const wa = waLink(settings.whatsapp, '');
  const body = `<section class="page-hero about-hero"><div class="wrap">
  <p class="kicker">${star('tick-star')}${esc(a.kicker)}</p>
  <h1>${esc(a.title)}</h1>
  <p class="lead">${esc(a.lead.replace('{store}', store))}</p>
</div></section>
<section class="wrap section about-intro">
  <div class="about-img reveal"><img src="/assets/photos/shop-bags.webp" alt="" width="1000" height="1250" loading="lazy"></div>
  <div class="reveal"><p>${esc(a.text)}</p>${trust(lang)}</div>
</section>
<section class="wrap section">
  ${sectionHead(a.howTitle)}
  <ol class="steps about-steps">${a.steps.map(([h, x], i) => `<li class="reveal" style="--d:${i * 70}ms"><span class="step-n">${i + 1}</span><strong>${esc(h)}</strong><p>${esc(x)}</p></li>`).join('')}</ol>
</section>
<section class="wrap section">
  ${sectionHead(a.promiseTitle)}
  <ul class="promises">${a.promises.map(([h, x], i) => `<li class="reveal" style="--d:${i * 70}ms">${icon(['box', 'cash', 'undo', 'phone'][i], 26)}<strong>${esc(h)}</strong><p>${esc(x)}</p></li>`).join('')}</ul>
</section>
<section class="wrap section narrow center about-contact">
  <h2>${esc(a.contactTitle)}</h2>
  <p>${esc(a.contactText)}</p>
  <p class="about-ctas"><a class="btn btn-accent" href="/${lang}/shop">${esc(a.cta)} ${icon('arrow', 18)}</a>${wa ? ` <a class="btn btn-outline" href="${esc(wa)}" rel="noopener">${waIcon(20)} ${esc(t.whatsappUs)}</a>` : ''}${settings.contact_email ? ` <a class="btn btn-outline" href="mailto:${esc(settings.contact_email)}">${esc(settings.contact_email)}</a>` : ''}</p>
</section>`;
  return layout(ctx, { title: a.title, description: a.lead.replace('{store}', store).slice(0, 160), path: '/about', body, page: 'about' });
}

export function notFoundPage(ctx) {
  const t = T[ctx.lang];
  const cats = (ctx.categories || []).map((c) => `<a class="chip" href="/${ctx.lang}/c/${esc(c.slug)}">${esc(catName(c, ctx.lang))}</a>`).join('');
  const body = `<section class="wrap section narrow center notfound">${star('burst-star')}<h1>${esc(t.notFound)}</h1><p>${esc(t.notFoundText)}</p><p class="about-ctas"><a class="btn" href="/${ctx.lang}/shop">${esc(t.allProducts)}</a><a class="btn btn-outline" href="/${ctx.lang}/">${esc(t.backHome)}</a></p>${cats ? `<div class="post-chips">${cats}</div>` : ''}</section>`;
  return layout(ctx, { title: t.notFound, path: '/', body, noindex: true });
}


// Blog. Posts come from the posts table (written in the admin). Each post page ends with the shop's
// current categories and newest products, so articles keep leading to products whatever is in stock.
const postField = (post, key, lang) => post[`${key}_${lang}`] || post[`${key}_fr`] || post[`${key}_en`] || post[`${key}_ar`] || '';
const postDate = (iso, lang) => {
  const d = new Date(`${String(iso || '').replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(DATE_LOCALE[lang], { dateStyle: 'long', numberingSystem: 'latn' }).format(d);
};
const isoDate = (iso) => `${String(iso || '').replace(' ', 'T')}Z`;

function postCard(post, lang, i = 0) {
  const t = T[lang];
  const title = postField(post, 'title', lang);
  const url = `/${lang}/blog/${esc(post.slug)}`;
  return `<article class="post-card reveal" style="--d:${(i % 3) * 80}ms">
  <a class="post-img" href="${url}" tabindex="-1" aria-hidden="true"><img src="${esc(small(post.cover || PLACEHOLDER))}" alt="" loading="lazy" width="480" height="600"></a>
  <div class="post-body">
    <p class="post-date">${esc(postDate(post.created_at, lang))}</p>
    <h2><a href="${url}">${esc(title)}</a></h2>
    <p>${esc(postField(post, 'excerpt', lang))}</p>
    <a class="more" href="${url}">${esc(t.readMore)}</a>
  </div>
</article>`;
}

export function blogIndexPage(ctx, posts) {
  const { lang } = ctx;
  const t = T[lang];
  const body = `<section class="page-hero">
  <div class="wrap"><p class="kicker">${star('tick-star')}${esc(t.blog)}</p><h1>${esc(t.blogTitle)}</h1><p class="lead">${esc(t.blogIntro)}</p></div>
</section>
<section class="wrap section">
  ${posts.length ? `<div class="post-grid">${posts.map((p, i) => postCard(p, lang, i)).join('')}</div>` : `<p class="empty">${esc(t.noPosts)}</p>`}
</section>`;
  const ld = [
    breadcrumbLd(ctx.origin, [[t.home, `/${lang}/`], [t.blog, `/${lang}/blog`]]),
    { '@context': 'https://schema.org', '@type': 'Blog', name: t.blogTitle, url: `${ctx.origin}/${lang}/blog`, inLanguage: lang, blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: postField(p, 'title', lang), url: `${ctx.origin}/${lang}/blog/${p.slug}`, datePublished: isoDate(p.created_at) })) },
  ];
  return layout(ctx, { title: t.blog, seoTitle: t.blogSeoTitle, description: t.blogIntro, path: '/blog', body, page: 'blog', ld });
}

export function blogPostPage(ctx, post, others, products) {
  const { lang, origin, settings, categories = [] } = ctx;
  const t = T[lang];
  const store = settings.store_name || 'Shop Hani';
  const title = postField(post, 'title', lang);
  const excerpt = postField(post, 'excerpt', lang);
  const raw = postField(post, 'body', lang);
  const words = htmlToText(raw).split(/\s+/).filter(Boolean).length;
  const cover = post.cover || '';
  const chips = categories.map((c) => `<a class="chip" href="/${lang}/c/${esc(c.slug)}">${esc(catName(c, lang))}</a>`).join('');
  const body = `<nav class="crumbs wrap" aria-label="breadcrumb"><a href="/${lang}/">${esc(t.home)}</a><span>/</span><a href="/${lang}/blog">${esc(t.blog)}</a><span>/</span><span aria-current="page">${esc(title)}</span></nav>
<article class="wrap narrow post">
  <header class="post-head">
    <p class="kicker">${esc(t.blog)}</p>
    <h1>${esc(title)}</h1>
    <p class="post-meta">${esc(t.publishedOn(postDate(post.created_at, lang)))} · ${esc(t.minRead(Math.max(1, Math.ceil(words / 200))))}</p>
  </header>
  ${cover ? `<img class="post-cover" src="${esc(cover)}" alt="${esc(title)}" width="1000" height="1250" fetchpriority="high">` : ''}
  <div class="rich post-text">${richDescHtml(raw)}</div>
  <aside class="post-cta">
    <h2>${esc(t.shopTheStore)}</h2>
    <p>${esc(t.shopTheStoreText)}</p>
    ${chips ? `<div class="post-chips">${chips}</div>` : ''}
    <a class="btn" href="/${lang}/shop">${esc(t.allProducts)}</a>
  </aside>
</article>
${products.length ? `<section class="section wrap">${sectionHead(t.latestProducts, t.shop, `/${lang}/shop`, t.viewAll)}${grid(products, ctx, '')}</section>` : ''}
${others.length ? `<section class="section wrap">${sectionHead(t.morePosts, t.blog, `/${lang}/blog`, t.viewAll)}<div class="post-grid">${others.map((p, i) => postCard(p, lang, i)).join('')}</div></section>` : ''}`;
  const url = `${origin}/${lang}/blog/${post.slug}`;
  const ld = [
    breadcrumbLd(origin, [[t.home, `/${lang}/`], [t.blog, `/${lang}/blog`], [title, `/${lang}/blog/${post.slug}`]]),
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: excerpt,
      ...(cover ? { image: abs(origin, cover) } : {}),
      datePublished: isoDate(post.created_at),
      dateModified: isoDate(post.updated_at || post.created_at),
      inLanguage: lang,
      wordCount: words,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: store, url: `${origin}/` },
      publisher: { '@type': 'Organization', name: store, logo: { '@type': 'ImageObject', url: `${origin}/assets/brand/logo-stacked-gold.png` } },
    },
  ];
  return layout(ctx, { title, seoTitle: title, description: excerpt || htmlToText(raw).slice(0, 158), path: `/blog/${post.slug}`, body, image: cover || BRAND_OG, page: 'blog', ld, ogType: 'article' });
}

export { catName };
