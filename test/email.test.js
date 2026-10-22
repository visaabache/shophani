import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validEmail, confirmationEmail, statusEmail, alertEmail, emailConfig } from '../src/email.js';

const order = { id: 1, number: 'SH-1', token: 'tok', lang: 'ar', name: 'سلمى <b>', phone: '212612345678', email: 's@x.ma', city: 'Rabat', address: 'Rue 1', note: '', shipping: 0, total: 300, status: 'shipped' };
const items = [{ name: 'Argan', option: '', price: 150, qty: 2 }];
const args = { order, items, origin: 'https://shop.test', cfg: { store: 'Shophani' }, settings: {} };

test('validEmail', () => {
  assert.ok(validEmail('a.b@gmail.com'));
  assert.ok(!validEmail('a@b'));
  assert.ok(!validEmail('a b@c.com'));
  assert.ok(!validEmail(''));
});

test('emails are in the customer language, escaped, and link to the order', () => {
  const m = confirmationEmail(args);
  assert.match(m.subject, /SH-1/);
  assert.match(m.html, /dir="rtl"/);
  assert.match(m.html, /https:\/\/shop\.test\/ar\/order\/SH-1\?t=tok/);
  assert.ok(!m.html.includes('<b>'));
  assert.match(statusEmail(args).subject, /شحن/);
  assert.match(alertEmail(args).subject, /Nouvelle commande SH-1/);
});

test('emails stay off without a key or a sender', () => {
  assert.equal(emailConfig({}, { email_from: 'a@b.co' }).on, false);
  assert.equal(emailConfig({ BREVO_API_KEY: 'k' }, {}).on, false);
  assert.equal(emailConfig({ BREVO_API_KEY: 'k' }, { email_from: 'a@b.co' }).on, true);
});
