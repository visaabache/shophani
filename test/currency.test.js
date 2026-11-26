import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currencyFor, formatPrice, ratesFrom } from '../src/currency.js';
import { money } from '../src/lib.js';

const req = (country, cookie = '') => ({ cf: country ? { country } : undefined, headers: new Headers(cookie ? { cookie } : {}) });

test('picks the currency from the visitor country', () => {
  assert.equal(currencyFor(req('MA'), {}), 'MAD');
  assert.equal(currencyFor(req('FR'), {}), 'EUR');
  assert.equal(currencyFor(req('ES'), {}), 'EUR');
  assert.equal(currencyFor(req('US'), {}), 'USD');
  assert.equal(currencyFor(req('GB'), {}), 'GBP');
  assert.equal(currencyFor(req('AE'), {}), 'AED');
  assert.equal(currencyFor(req('JP'), {}), 'USD');
  assert.equal(currencyFor(req(null), {}), 'MAD');
  assert.equal(currencyFor(req('T1'), {}), 'MAD');
});

test('the visitor choice wins, and the admin switch turns it all off', () => {
  assert.equal(currencyFor(req('FR', 'lang=fr; cur=USD'), {}), 'USD');
  assert.equal(currencyFor(req('FR', 'cur=XYZ'), {}), 'EUR');
  assert.equal(currencyFor(req('FR', 'cur=USD'), { auto_currency: '0' }), 'MAD');
});

test('formats converted prices, and dirhams as before', () => {
  const rates = { MAD: 1, EUR: 0.1, USD: 0.11, KWD: 0.0333 };
  assert.equal(formatPrice(499, 'fr', 'MAD', rates), money(499, 'fr'));
  assert.equal(formatPrice(499, 'en', 'USD', rates), '$54.89');
  assert.match(formatPrice(499, 'fr', 'EUR', rates), /^49,90\s€$/);
  assert.match(formatPrice(499, 'ar', 'EUR', rates), /49[,.٫]90/);
  assert.match(formatPrice(1000, 'en', 'KWD', rates), /^KWD\s33\.300$/);
  assert.equal(formatPrice(499, 'en', 'EUR', {}), 'MAD 499'); // no rate: stays in dirhams
});

test('stale or missing rates refresh in the background without blocking', () => {
  globalThis.fetch = async () => ({ ok: false }); // no network in tests
  const jobs = [];
  const exec = { waitUntil: (p) => jobs.push(p) };
  const env = { DB: { prepare: () => ({ bind: () => ({ run: async () => {} }) }) } };
  const fresh = JSON.stringify({ ts: Date.now(), rates: { EUR: 0.09 } });
  assert.equal(ratesFrom({ fx_rates: fresh }, env, exec).EUR, 0.09);
  assert.equal(jobs.length, 0);
  const old = JSON.stringify({ ts: Date.now() - 13 * 3600e3, rates: { EUR: 0.08 } });
  assert.equal(ratesFrom({ fx_rates: old }, env, { waitUntil: () => {} }).EUR, 0.08);
  const r = ratesFrom({}, env, { waitUntil: (p) => p.catch(() => {}) });
  assert.ok(r.EUR > 0 && r.USD > 0);
});
