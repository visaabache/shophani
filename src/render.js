// Server-rendered storefront pages. Every page works without JavaScript except the cart,
// checkout and add-to-cart buttons, which use public/assets/store.js.

import { T } from './i18n.js';
import { CITIES, LANGS, esc, money, productName, productDesc, productImages, productOptions } from './lib.js';

const PLACEHOLDER = '/assets/placeholder.svg';

function catName(c, lang) {
  return c[`name_${lang}`] || c.name_fr || c.name_en || c.name_ar || c.slug;
}

function waLink(number, text) {
  const n = String(number || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
}

export function layout(ctx, { title, description = '', path, body, noindex = false, image = '' }) {
  const { lang, settings, origin, categories = [] } = ctx;
  const t = T[lang];
  const store = settings.store_name || 'Shophani';
  const fullTitle = title ? `${title} · ${store}` : store;
  const announcement = settings[`announcement_${lang}`] || '';
  const wa = waLink(settings.whatsapp);
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(origin)}/${l}${esc(path)}">`).join('');
  const switcher = LANGS.filter((l) => l !== lang)
    .map((l) => `<a href="/${l}${esc(path)}" hreflang="${l}" lang="${l}">${l === 'ar' ? 'ع' : l.toUpperCase()}</a>`)
    .join('');
  const chips = categories
    .map((c) => `<a class="chip" href="/${lang}/c/${esc(c.slug)}">${esc(catName(c, lang))}</a>`)
    .join('');
  const ogImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : '';
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || t.heroText)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(origin)}/${lang}${esc(path)}">${alternates}<link rel="alternate" hreflang="x-default" href="${esc(origin)}/fr${esc(path)}">`}
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description || t.heroText)}">
<meta property="og:type" content="website">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="theme-color" content="#1d3fbf">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/style.css">
<script src="/assets/store.js" defer></script>
</head>
<body data-lang="${lang}">
${announcement ? `<div class="announce">${esc(announcement)}</div>` : ''}
<header class="top">
  <div class="wrap top-row">
    <a class="logo" href="/${lang}/">${esc(store)}</a>
    <nav class="top-actions">
      <span class="langs">${switcher}</span>
      <a class="cart-link" href="/${lang}/cart" aria-label="${esc(t.cart)}">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5.2 4l.4 2H20a1 1 0 0 1 1 1.2l-1.4 7A2 2 0 0 1 17.6 16H8.1a2 2 0 0 1-2-1.6L3.6 3H2V1h3a1 1 0 0 1 1 .8L6.2 4H5.2Z"/></svg>
        <span class="cart-count" hidden>0</span>
      </a>
    </nav>
  </div>
  ${chips ? `<nav class="chips wrap" aria-label="${esc(t.categories)}"><a class="chip" href="/${lang}/shop">${esc(t.allProducts)}</a>${chips}</nav>` : ''}
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-grid">
    <div><strong>${esc(store)}</strong><p>${esc(t.cod)} · ${esc(t.delivery)}</p></div>
    <div>${settings.whatsapp ? `<a href="${esc(wa)}" rel="noopener">${esc(t.whatsappUs)}</a>` : ''}${settings.contact_email ? `<br><a href="mailto:${esc(settings.contact_email)}">${esc(settings.contact_email)}</a>` : ''}</div>
  </div>
  <p class="wrap small">© ${new Date().getUTCFullYear()} ${esc(store)}. ${esc(t.rights)}</p>
</footer>
${wa ? `<a class="wa-float" href="${esc(wa)}" rel="noopener" aria-label="${esc(t.whatsappUs)}"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.8c-2 0-4-.5-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.8 10.8 0 1 1 16 26.8Zm6-8.1c-.3-.2-1.9-1-2.2-1-.3-.2-.5-.2-.7.1l-1 1.3c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.6-.5-.8-.5h-.6c-.2 0-.6 0-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.4Z"/></svg></a>` : ''}
<div class="toast" role="status" aria-live="polite" hidden></div>
<script type="application/json" id="i18n">${JSON.stringify({ ...t.js, lang }).replace(/</g, '\\u003c')}</script>
</body>
</html>`;
}

export function productCard(p, lang) {
  const t = T[lang];
  const img = productImages(p)[0] || PLACEHOLDER;
  const name = productName(p, lang);
  const soldOut = p.stock != null && p.stock <= 0;
  const onSale = p.compare_price && p.compare_price > p.price;
  return `<article class="card">
  <a href="/${lang}/p/${esc(p.slug)}" class="card-img">
    <img src="${esc(img)}" alt="${esc(name)}" loading="lazy" width="600" height="600">
    ${soldOut ? `<span class="badge muted">${esc(t.outOfStock)}</span>` : onSale ? `<span class="badge">${esc(t.sale)}</span>` : ''}
  </a>
  <div class="card-body">
    <h3><a href="/${lang}/p/${esc(p.slug)}">${esc(name)}</a></h3>
    <p class="price">${esc(money(p.price, lang))}${onSale ? ` <s>${esc(money(p.compare_price, lang))}</s>` : ''}</p>
  </div>
</article>`;
}

function grid(products, lang, emptyText) {
  return products.length
    ? `<div class="grid">${products.map((p) => productCard(p, lang)).join('')}</div>`
    : `<p class="empty">${esc(emptyText)}</p>`;
}

function trust(lang) {
  const t = T[lang];
  const item = (icon, title, text) => `<li><span class="trust-icon" aria-hidden="true">${icon}</span><div><strong>${esc(title)}</strong><span>${esc(text)}</span></div></li>`;
  return `<ul class="trust">
  ${item('💵', t.cod, t.codText)}
  ${item('🚚', t.delivery, t.deliveryText)}
  ${item('📞', t.confirm, t.confirmText)}
</ul>`;
}

export function homePage(ctx, featured, latest) {
  const { lang } = ctx;
  const t = T[lang];
  const body = `<section class="hero">
  <div class="wrap">
    <h1>${esc(ctx.settings[`hero_title_${lang}`] || t.heroTitle)}</h1>
    <p>${esc(ctx.settings[`hero_text_${lang}`] || t.heroText)}</p>
    <a class="btn btn-light" href="/${lang}/shop">${esc(t.heroCta)}</a>
  </div>
</section>
<div class="wrap">${trust(lang)}</div>
${featured.length ? `<section class="wrap section"><h2>${esc(t.featured)}</h2>${grid(featured, lang, t.noProducts)}</section>` : ''}
<section class="wrap section"><h2>${esc(t.allProducts)}</h2>${grid(latest, lang, t.noProducts)}
${latest.length ? `<p class="center"><a class="btn btn-outline" href="/${lang}/shop">${esc(t.heroCta)}</a></p>` : ''}</section>`;
  return layout(ctx, { title: '', path: '/', body, image: productImages(featured[0] || latest[0] || {})[0] });
}

export function listingPage(ctx, { title, path, products, q = '', description = '' }) {
  const { lang } = ctx;
  const t = T[lang];
  const body = `<section class="wrap section">
  <h1>${esc(title)}</h1>
  ${description ? `<p class="lead">${esc(description)}</p>` : ''}
  <form class="search" action="/${lang}/shop" method="get" role="search">
    <input type="search" name="q" value="${esc(q)}" placeholder="${esc(t.search)}" aria-label="${esc(t.search)}">
    <button class="btn" type="submit" aria-label="${esc(t.search)}">⌕</button>
  </form>
  ${grid(products, lang, q ? t.noResults : t.noProducts)}
</section>`;
  return layout(ctx, { title, path: q ? `${path}?q=${encodeURIComponent(q)}` : path, body, noindex: Boolean(q) });
}

export function productPage(ctx, p, category, related) {
  const { lang, origin, settings } = ctx;
  const t = T[lang];
  const name = productName(p, lang);
  const desc = productDesc(p, lang);
  const images = productImages(p);
  if (!images.length) images.push(PLACEHOLDER);
  const options = productOptions(p);
  const soldOut = p.stock != null && p.stock <= 0;
  const onSale = p.compare_price && p.compare_price > p.price;
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
    },
  };
  const wa = waLink(settings.whatsapp, `${name} — ${money(p.price, lang)}\n${origin}/${lang}/p/${p.slug}`);
  const body = `<section class="wrap product">
  <div class="gallery" aria-label="${esc(name)}">
    <div class="gallery-track">${images.map((u, i) => `<img src="${esc(u)}" alt="${esc(name)}${i ? ` ${i + 1}` : ''}" width="800" height="800"${i ? ' loading="lazy"' : ''}>`).join('')}</div>
    ${images.length > 1 ? `<div class="dots">${images.map(() => '<span></span>').join('')}</div>` : ''}
  </div>
  <div class="product-info">
    ${category ? `<a class="crumb" href="/${lang}/c/${esc(category.slug)}">${esc(catName(category, lang))}</a>` : ''}
    <h1>${esc(name)}</h1>
    <p class="price big">${esc(money(p.price, lang))}${onSale ? ` <s>${esc(money(p.compare_price, lang))}</s>` : ''}</p>
    ${!soldOut && p.stock != null && p.stock <= 5 ? `<p class="stock-low">${esc(t.onlyLeft(p.stock))}</p>` : ''}
    <form class="buy" novalidate data-product="${p.id}" data-name="${esc(name)}" data-price="${p.price}" data-image="${esc(images[0])}" data-slug="${esc(p.slug)}">
      ${options.length ? `<fieldset class="options"><legend>${esc(t.choose)}</legend>${options.map((o, i) => `<label><input type="radio" name="option" value="${esc(o)}"${i === 0 && options.length === 1 ? ' checked' : ''} required><span>${esc(o)}</span></label>`).join('')}</fieldset>` : ''}
      <div class="qty-row">
        <label for="qty">${esc(t.quantity)}</label>
        <div class="qty"><button type="button" data-step="-1" aria-label="−">−</button><input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${p.stock != null ? Math.max(1, Math.min(20, p.stock)) : 20}" value="1"><button type="button" data-step="1" aria-label="+">+</button></div>
      </div>
      ${soldOut ? `<button class="btn btn-block" type="button" disabled>${esc(t.outOfStock)}</button>` : `<button class="btn btn-block btn-accent" type="submit" name="go" value="checkout">${esc(t.buyNow)}</button>
      <button class="btn btn-block btn-outline" type="submit" name="go" value="cart">${esc(t.addToCart)}</button>`}
    </form>
    ${trust(lang)}
    ${desc ? `<div class="desc">${esc(desc).replace(/\n/g, '<br>')}</div>` : ''}
    ${wa ? `<p><a class="wa-inline" href="${esc(wa)}" rel="noopener">${esc(t.whatsappUs)}</a></p>` : ''}
  </div>
</section>
${related.length ? `<section class="wrap section"><h2>${esc(t.featured)}</h2>${grid(related, lang, '')}</section>` : ''}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  return layout(ctx, { title: name, description: desc.slice(0, 160), path: `/p/${p.slug}`, body, image: images[0] });
}

export function cartPage(ctx) {
  const { lang } = ctx;
  const t = T[lang];
  const body = `<section class="wrap section narrow">
  <h1>${esc(t.cart)}</h1>
  <div id="cart" class="cart" data-view="cart"><p class="empty">…</p></div>
  <noscript><p>JavaScript is required for the cart.</p></noscript>
</section>`;
  return layout(ctx, { title: t.cart, path: '/cart', body, noindex: true });
}

export function checkoutPage(ctx) {
  const { lang } = ctx;
  const t = T[lang];
  const cities = CITIES.map((c) => `<option>${esc(c)}</option>`).join('');
  const body = `<section class="wrap section narrow">
  <h1>${esc(t.checkout)}</h1>
  <div class="checkout">
    <form id="checkout" class="form" novalidate>
      <label>${esc(t.fullName)}<input name="name" autocomplete="name" required maxlength="80"></label>
      <label>${esc(t.phone)}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(t.phoneHint)}" required maxlength="20" dir="ltr"></label>
      <label>${esc(t.city)}<select name="city" required><option value="">${esc(t.chooseCity)}</option>${cities}<option value="__other">${esc(t.otherCity)}</option></select></label>
      <label class="other-city" hidden>${esc(t.otherCity)}<input name="city_other" maxlength="60"></label>
      <label>${esc(t.address)}<textarea name="address" rows="2" placeholder="${esc(t.addressHint)}" required maxlength="300"></textarea></label>
      <label>${esc(t.note)}<textarea name="note" rows="2" maxlength="500"></textarea></label>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="summary"><h2>${esc(t.yourOrder)}</h2><div id="cart" data-view="summary"></div></div>
      <p class="cod-note">💵 ${esc(t.payOnDelivery)}</p>
      <button class="btn btn-block btn-accent" type="submit">${esc(t.placeOrder)}</button>
      <p class="form-error" role="alert" hidden></p>
    </form>
  </div>
</section>`;
  return layout(ctx, { title: t.checkout, path: '/checkout', body, noindex: true });
}

export function orderPage(ctx, order, items) {
  const { lang, settings } = ctx;
  const t = T[lang];
  const wa = waLink(settings.whatsapp, `${t.orderNumber}: ${order.number}`);
  const body = `<section class="wrap section narrow">
  <div class="thanks">
    <div class="check" aria-hidden="true">✓</div>
    <h1>${esc(t.thanks)}</h1>
    <p>${esc(t.thanksText)}</p>
  </div>
  <dl class="order-meta">
    <div><dt>${esc(t.orderNumber)}</dt><dd dir="ltr">${esc(order.number)}</dd></div>
    <div><dt>${esc(t.orderStatus)}</dt><dd>${esc(t.status[order.status] || order.status)}</dd></div>
    <div><dt>${esc(t.deliverTo)}</dt><dd>${esc(order.name)}, ${esc(order.city)}</dd></div>
  </dl>
  <ul class="lines">${items.map((i) => `<li><span>${esc(i.name)}${i.option ? ` · ${esc(i.option)}` : ''} × ${i.qty}</span><span>${esc(money(i.price * i.qty, lang))}</span></li>`).join('')}
    <li><span>${esc(t.js.shipping)}</span><span>${order.shipping ? esc(money(order.shipping, lang)) : esc(t.js.free)}</span></li>
    <li class="total"><span>${esc(t.js.total)}</span><span>${esc(money(order.total, lang))}</span></li>
  </ul>
  <p class="cod-note">💵 ${esc(t.payOnDelivery)}</p>
  <p class="center"><a class="btn btn-outline" href="/${lang}/shop">${esc(t.continueShopping)}</a>${wa ? ` <a class="btn btn-wa" href="${esc(wa)}" rel="noopener">${esc(t.whatsappUs)}</a>` : ''}</p>
</section>`;
  return layout(ctx, { title: t.thanks, path: '/', body, noindex: true });
}

export function notFoundPage(ctx) {
  const t = T[ctx.lang];
  const body = `<section class="wrap section narrow center"><h1>${esc(t.notFound)}</h1><p>${esc(t.notFoundText)}</p><p><a class="btn" href="/${ctx.lang}/">${esc(t.backHome)}</a></p></section>`;
  return layout(ctx, { title: t.notFound, path: '/', body, noindex: true });
}

export { catName };
