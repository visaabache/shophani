import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalDoc } from '../src/legal.js';
import { legalPage, socialUrl, layout } from '../src/render.js';

const settings = { store_name: 'Shophani', whatsapp: '212600000000', contact_email: 'a@b.ma', free_shipping_over: '500' };
const ctx = (lang, s = settings) => ({ lang, settings: s, categories: [], origin: 'https://shop.test' });

test('legal pages exist in every language and mark missing company details', () => {
  for (const lang of ['ar', 'fr', 'en']) {
    for (const kind of ['privacy', 'terms']) {
      const doc = legalDoc(kind, lang, settings);
      assert.ok(doc.title && doc.sections.length >= 5, `${kind}/${lang}`);
      assert.match(doc.sections.map((s) => s[1]).join(''), /<mark>/);
    }
  }
  assert.match(legalDoc('privacy', 'fr', settings).sections.map((s) => s[1]).join(''), /09-08/);
  assert.match(legalDoc('terms', 'fr', settings).sections.map((s) => s[1]).join(''), /31-08/);
});

test('company details are escaped and replace the placeholders', () => {
  const s = { ...settings, legal_name: 'Shop <b>SARL</b>', legal_ice: '1', legal_rc: '2', legal_address: 'Rabat', legal_cndp: '3' };
  const html = legalPage(ctx('fr', s), 'terms');
  assert.match(html, /Shop &lt;b&gt;SARL&lt;\/b&gt;/);
  assert.doesNotMatch(html, /legal-draft/);
  assert.match(legalPage(ctx('fr'), 'terms'), /legal-draft/);
});

test('socialUrl accepts links and handles, rejects other schemes', () => {
  assert.equal(socialUrl('instagram', '@shop.hani'), 'https://www.instagram.com/shop.hani');
  assert.equal(socialUrl('tiktok', 'shophani'), 'https://www.tiktok.com/@shophani');
  assert.equal(socialUrl('facebook', 'https://facebook.com/x'), 'https://facebook.com/x');
  assert.equal(socialUrl('facebook', 'javascript:alert(1)'), 'https://www.facebook.com/javascriptalert1');
  assert.equal(socialUrl('instagram', ''), '');
});

test('layout shows social icons and the WhatsApp panel with a product message', () => {
  const html = layout(ctx('ar', { ...settings, instagram: '@shophani' }), { title: 'x', path: '/', body: '', product: { name: 'Sac', price: '100 DH', slug: 'sac' } });
  assert.match(html, /social-instagram/);
  assert.doesNotMatch(html, /social-facebook/);
  assert.match(html, /data-wa-toggle/);
  assert.match(html, /wa\.me\/212600000000\?text=[^"]*Sac/);
  assert.match(html, /\/ar\/privacy/);
  assert.doesNotMatch(layout(ctx('fr', { store_name: 'S' }), { title: 'x', path: '/', body: '' }), /data-wa/);
});

test('pixels load only with a valid ID, and the CSP and privacy policy follow', async () => {
  const { pixelConfig, pixelCsp } = await import('../src/pixels.js');
  assert.deepEqual(pixelConfig({ meta_pixel_id: '123456789012345', tiktok_pixel_id: 'c4abcdefghij1234' }), { meta: '123456789012345', tiktok: 'C4ABCDEFGHIJ1234' });
  assert.deepEqual(pixelConfig({ meta_pixel_id: '<script>', tiktok_pixel_id: 'x"y' }), { meta: '', tiktok: '' });
  const base = "default-src 'self'; script-src 'self'; connect-src 'self'";
  assert.equal(pixelCsp(base, {}), base);
  assert.match(pixelCsp(base, { meta_pixel_id: '123456789012345' }), /script-src 'self' https:\/\/connect\.facebook\.net;/);
  const s = { ...settings, meta_pixel_id: '123456789012345' };
  const html = layout(ctx('fr', s), { title: 'x', path: '/', body: '' });
  assert.match(html, /id="pixels"/);
  assert.match(html, /id="consent"/);
  assert.doesNotMatch(layout(ctx('fr'), { title: 'x', path: '/', body: '' }), /pixels\.js/);
  assert.match(legalDoc('privacy', 'fr', s).sections.map((x) => x[1]).join(''), /Meta Pixel/);
  assert.doesNotMatch(legalDoc('privacy', 'fr', settings).sections.map((x) => x[1]).join(''), /Meta Pixel/);
});
