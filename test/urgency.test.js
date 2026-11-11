import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCity, cityKey, CITY_SUGGEST, CITIES, packOptions, productLeft, storeLeft, cleanBundles, productOptions } from '../src/lib.js';

test('typed cities are saved in their usual spelling', () => {
  assert.equal(matchCity('casa'), 'Casablanca');
  assert.equal(matchCity('  الدار البيضاء '), 'Casablanca');
  assert.equal(matchCity('كازا'), 'Casablanca');
  assert.equal(matchCity('FES'), 'Fès');
  assert.equal(matchCity('fez'), 'Fès');
  assert.equal(matchCity('اكادير'), 'Agadir');
  assert.equal(matchCity('Beni-Mellal'), 'Béni Mellal');
  assert.equal(matchCity('محمدية'), 'Mohammedia');
  assert.equal(matchCity('Sidi Ifni'), 'Sidi Ifni'); // not in the list: kept as typed
  assert.equal(matchCity(''), '');
});

test('every checkout city is in the suggestions, once', () => {
  const names = CITY_SUGGEST.map((c) => c[0]);
  for (const c of CITIES) assert.ok(names.includes(c), c);
  assert.equal(new Set(names.map(cityKey)).size, names.length);
  for (const [, ar] of CITY_SUGGEST) assert.ok(ar);
});

test('pieces left in the offer are kept with the options', () => {
  const groups = [{ name: { fr: 'Taille' }, values: [{ label: 'M' }] }];
  const bundles = [{ qty: 2, price: 340 }];
  const packed = packOptions(groups, bundles, '7');
  assert.equal(productLeft({ options: packed }), 7);
  assert.deepEqual(cleanBundles(packed).map((b) => b.qty), [2]);
  assert.equal(productOptions({ options: packed }).length, 1);
  assert.equal(productLeft({ options: packOptions(groups, bundles, '') }), null);
  assert.equal(productLeft({ options: packOptions(groups, [], 0) }), 0);
  assert.equal(productOptions({ options: packOptions(groups, [], 3) }).length, 1);
  assert.equal(packOptions(groups, [], ''), JSON.stringify(productOptions({ options: JSON.stringify(groups) })));
  assert.equal(productLeft({ options: JSON.stringify(groups) }), null);
});

test('the store-wide number is 7 until it is changed', () => {
  assert.equal(storeLeft({}), 7);
  assert.equal(storeLeft({ offer_left: '12' }), 12);
  assert.equal(storeLeft({ offer_left: '' }), null);
});
