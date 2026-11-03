import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homePage, listingPage, productPage, blogIndexPage, blogPostPage, notFoundPage } from '../src/render.js';

const settings = { store_name: 'Shop Hani', whatsapp: '212600000000', instagram: '@shophani', google_verify: '<meta name="google-site-verification" content="abc123DEF456ghi789" />' };
const categories = [{ id: 1, slug: 'mode', name_fr: 'Mode', name_ar: 'الأزياء', name_en: 'Fashion' }];
const ctx = (lang = 'fr') => ({ lang, settings, categories, origin: 'https://shophani.online' });
const product = { id: 7, slug: 'sac-cuir', name_fr: 'Sac en cuir', price: 499, images: '["/assets/photos/handbag.webp"]', category_id: 1, desc_fr: '' };
const post = { id: 1, slug: 'guide', title_fr: 'Guide d’achat', excerpt_fr: 'Résumé du guide.', body_fr: '<h2>Partie</h2><p>Du texte <script>alert(1)</script>utile.</p>', cover: '/assets/photos/delivery.webp', created_at: '2026-11-01 10:00:00', updated_at: '2026-11-02 10:00:00' };

// Every JSON-LD block on the page, parsed.
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const types = (html) => ld(html).map((o) => o['@type']);

test('home page: keyword title, canonical on the store domain, store and FAQ data, Search Console tag', () => {
  const html = homePage(ctx(), [], []);
  assert.match(html, /<title>Shop Hani · Boutique en ligne au Maroc/);
  assert.match(html, /<link rel="canonical" href="https:\/\/shophani.online\/fr\/">/);
  assert.match(html, /<meta property="og:locale" content="fr_FR">/);
  assert.match(html, /<meta name="google-site-verification" content="abc123DEF456ghi789">/);
  assert.deepEqual(types(html), ['OnlineStore', 'WebSite', 'FAQPage']);
  assert.ok(ld(html)[0].sameAs.includes('https://www.instagram.com/shophani.online'));
  assert.match(html, /class="section wrap seo-block"/);
});

test('category page: keyword title and description built from the category name', () => {
  const html = listingPage(ctx(), { title: 'Mode', path: '/c/mode', products: [product], seoTitle: 'Mode · Achat en ligne au Maroc, livraison gratuite', metaDescription: 'Achetez Mode en ligne au Maroc.', description: 'Notre sélection Mode.' });
  assert.match(html, /<title>Mode · Achat en ligne au Maroc, livraison gratuite \| Shop Hani<\/title>/);
  assert.match(html, /<meta name="description" content="Achetez Mode en ligne au Maroc.">/);
  assert.deepEqual(types(html), ['BreadcrumbList', 'ItemList']);
});

test('product page: description fallback with the price, free shipping and returns in the offer', () => {
  const html = productPage(ctx(), product, categories[0], []);
  assert.match(html, /<title>Sac en cuir · Prix au Maroc \| Shop Hani<\/title>/);
  assert.match(html, /<meta name="description" content="Sac en cuir à 499.DH sur Shop Hani. Livraison gratuite/);
  const offer = ld(html).find((o) => o['@type'] === 'Product').offers;
  assert.equal(offer.shippingDetails.shippingRate.value, '0');
  assert.equal(offer.hasMerchantReturnPolicy.merchantReturnDays, 7);
  assert.ok(types(html).includes('BreadcrumbList'));
});

test('blog pages: list and article with cleaned text, article data and links back to the shop', () => {
  const list = blogIndexPage(ctx(), [post]);
  assert.match(list, /href="\/fr\/blog\/guide"/);
  assert.ok(types(list).includes('Blog'));
  const html = blogPostPage(ctx(), post, [], [product]);
  assert.match(html, /<title>Guide d’achat \| Shop Hani<\/title>/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.doesNotMatch(html, /alert\(1\)/);
  assert.match(html, /href="\/fr\/c\/mode"/);
  assert.match(html, /href="\/fr\/p\/sac-cuir"/);
  const article = ld(html).find((o) => o['@type'] === 'BlogPosting');
  assert.equal(article.datePublished, '2026-11-01T10:00:00Z');
  assert.equal(article.mainEntityOfPage, 'https://shophani.online/fr/blog/guide');
});

test('Arabic pages use Arabic keywords and locale', () => {
  const html = homePage(ctx('ar'), [], []);
  assert.match(html, /<title>Shop Hani · متجر إلكتروني في المغرب/);
  assert.match(html, /content="ar_MA"/);
});

test('not found page offers the shop and current categories, and is not indexed', () => {
  const html = notFoundPage(ctx());
  assert.match(html, /noindex/);
  assert.match(html, /href="\/fr\/shop"/);
  assert.match(html, /href="\/fr\/c\/mode"/);
});

test('www and workers.dev addresses redirect to the store domain; API calls do not', async () => {
  const { default: worker } = await import('../src/worker.js');
  const env = { SITE_URL: 'https://shophani.online' };
  const go = (u, method = 'GET') => worker.fetch(new Request(u, { method }), env, { waitUntil() {} });
  for (const u of ['https://www.shophani.online/fr/shop?q=sac', 'https://abolux.visaabache.workers.dev/fr/shop?q=sac']) {
    const r = await go(u);
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), 'https://shophani.online/fr/shop?q=sac');
  }
  const api = await go('https://abolux.visaabache.workers.dev/api/orders', 'POST').catch(() => null);
  assert.ok(!api || api.status !== 301);
});
