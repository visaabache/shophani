import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanBundles, packOptions, productOptions, productBundles, bundleTotal, splitLine, lineText, quote } from '../src/lib.js';

const groups = [{ name: { fr: 'Couleur' }, type: 'color', values: [{ label: 'Rouge', color: '#ff0000' }, { label: 'Noir', color: '#000000', price: 20 }] }];
const offers = [
  { qty: 3, price: 480, hot: true, label: { ar: 'ثلاثة طقوم', fr: '' } },
  { qty: 2, price: 340 },
  { qty: 2, price: 300 }, // same quantity twice: the first one stays
  { qty: 1, price: 150 }, // one piece is always the normal price
  { qty: 4, price: 0 },
];

test('cleanBundles keeps valid offers, sorted by quantity', () => {
  const b = cleanBundles({ bundles: offers });
  assert.deepEqual(b.map((x) => [x.qty, x.price, x.hot]), [[2, 340, false], [3, 480, true]]);
  assert.equal(b[1].label.ar, 'ثلاثة طقوم');
  assert.deepEqual(cleanBundles(JSON.stringify(groups)), []);
  assert.deepEqual(cleanBundles('S, M'), []);
});

test('options and offers share the options column and old products still read', () => {
  const packed = packOptions(JSON.stringify(groups), offers);
  const p = { options: packed };
  assert.equal(productOptions(p).length, 1);
  assert.equal(productBundles(p).length, 2);
  assert.equal(packOptions(groups, []), JSON.stringify(productOptions({ options: JSON.stringify(groups) })));
  assert.equal(packOptions([], []), '');
});

test('bundleTotal uses the biggest offer that fits and adds option prices per piece', () => {
  const b = cleanBundles({ bundles: offers });
  assert.deepEqual(bundleTotal(b, 200, 0, 1), { total: 200, tier: null, saved: 0 });
  assert.equal(bundleTotal(b, 200, 0, 2).total, 340);
  assert.equal(bundleTotal(b, 200, 0, 3).total, 480);
  assert.equal(bundleTotal(b, 200, 0, 4).total, 680);
  assert.equal(bundleTotal(b, 200, 20, 2).total, 380);
  assert.equal(bundleTotal(b, 200, 20, 2).saved, 60);
  // An offer that is no longer cheaper (the price went down) is ignored.
  assert.equal(bundleTotal(b, 150, 0, 3).total, 450);
});

test('splitLine keeps whole dirhams and the exact total', () => {
  assert.deepEqual(splitLine(480, 3), [{ price: 160, qty: 3 }]);
  assert.deepEqual(splitLine(500, 3), [{ price: 166, qty: 1 }, { price: 167, qty: 2 }]);
  assert.deepEqual(splitLine(200, 1), [{ price: 200, qty: 1 }]);
});

test('quote prices offers on the server and names them on the order line', async () => {
  const product = { id: 1, price: 200, stock: null, active: 1, options: packOptions(groups, offers) };
  const db = { prepare: () => ({ bind: () => ({ all: async () => ({ results: [product] }) }) }) };
  const q = await quote(db, [{ id: 1, option: 'Noir', qty: 3 }], '', {});
  assert.equal(q.total, 540);
  assert.equal(q.lines[0].saved, 120);
  assert.equal(lineText(q.lines[0], 'fr'), 'Couleur: Noir · Offre 3 pièces');
  assert.equal(lineText(q.lines[0], 'ar'), 'Couleur: Noir · ثلاثة طقوم');
  const one = await quote(db, [{ id: 1, option: 'Rouge', qty: 1 }], '', {});
  assert.equal(one.total, 200);
  assert.equal(lineText(one.lines[0], 'fr'), 'Couleur: Rouge');
});
