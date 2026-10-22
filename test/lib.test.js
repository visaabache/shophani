import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, displayPhone, money, shippingFor, slugify, orderNumber } from '../src/lib.js';

test('normalizePhone accepts Moroccan formats', () => {
  for (const v of ['06 12 34 56 78', '0612345678', '+212 6 12 34 56 78', '00212612345678', '212612345678', '06.12.34.56.78']) {
    assert.equal(normalizePhone(v), '212612345678', v);
  }
  assert.equal(normalizePhone('0712345678'), '212712345678');
  assert.equal(normalizePhone('0522123456'), '212522123456');
});

test('normalizePhone rejects other numbers', () => {
  for (const v of ['', '123', '0812345678', '061234567', '+33612345678', 'abc']) assert.equal(normalizePhone(v), null, v);
});

test('displayPhone formats for humans', () => {
  assert.equal(displayPhone('212612345678'), '06 12 34 56 78');
});

test('money per language', () => {
  assert.equal(money(1299, 'fr'), '1 299 DH');
  assert.equal(money(1299, 'en'), 'MAD 1,299');
  assert.equal(money(99, 'ar'), '99 درهم');
});

test('shipping: city rate, default, free threshold', () => {
  const s = { shipping_fee: '35', shipping_rates: '{"Casablanca": 20}', free_shipping_over: '500' };
  assert.equal(shippingFor('Casablanca', 100, s), 20);
  assert.equal(shippingFor('Agadir', 100, s), 35);
  assert.equal(shippingFor('Agadir', 500, s), 0);
  assert.equal(shippingFor('Agadir', 900, { ...s, free_shipping_over: '0' }), 35);
});

test('slugify strips accents', () => {
  assert.equal(slugify('Huile d’argan Pure 100 ml'), 'huile-d-argan-pure-100-ml');
  assert.equal(slugify('Thé à la menthe'), 'the-a-la-menthe');
});

test('orderNumber shape', () => {
  assert.match(orderNumber(new Date('2026-10-22T10:00:00Z')), /^261022-[2-9A-Z]{4}$/);
});
