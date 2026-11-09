import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanOptions, productOptions, resolveChoice, choiceText, quote } from '../src/lib.js';

const groups = cleanOptions([
  { name: { ar: 'اللون', fr: 'Couleur', en: 'Color' }, type: 'color', values: [{ label: 'Rouge', color: '#FF0000' }, { label: 'Noir', color: 'bad', price: 30 }] },
  { name: { fr: 'Taille' }, values: [{ label: 'M' }, { label: 'XL', price: '20' }, { label: 'XL' }, { label: '' }] },
  { name: { fr: 'Vide' }, values: [] },
]);

test('cleanOptions keeps groups with values and cleans them', () => {
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].values, [{ label: 'Rouge', color: '#ff0000', price: 0 }, { label: 'Noir', color: '#cccccc', price: 30 }]);
  assert.deepEqual(groups[1].values.map((v) => v.label), ['M', 'XL']);
  assert.equal(groups[1].type, 'text');
});

test('old comma lists read as one unnamed group', () => {
  const g = productOptions({ options: 'S, M, L' });
  assert.equal(g.length, 1);
  assert.deepEqual(g[0].values.map((v) => v.label), ['S', 'M', 'L']);
  assert.equal(choiceText(resolveChoice(g, 'M'), 'fr'), 'M');
  assert.deepEqual(productOptions({ options: '' }), []);
});

test('a slash with spaces cannot break the choice key', () => {
  const g = cleanOptions([{ values: [{ label: '38 / 40' }] }]);
  assert.equal(g[0].values[0].label, '38/40');
});

test('resolveChoice checks every group and adds price changes', () => {
  const c = resolveChoice(groups, 'Noir / XL');
  assert.equal(c.extra, 50);
  assert.equal(choiceText(c, 'fr'), 'Couleur: Noir · Taille: XL');
  assert.equal(choiceText(c, 'ar'), 'اللون: Noir · Taille: XL');
  assert.equal(resolveChoice(groups, 'Noir'), null);
  assert.equal(resolveChoice(groups, 'Bleu / M'), null);
  assert.deepEqual(resolveChoice([], 'anything'), { key: '', picks: [], extra: 0 });
});

test('quote prices the chosen variant on the server', async () => {
  const product = { id: 1, price: 200, stock: null, active: 1, options: JSON.stringify(groups) };
  const db = { prepare: () => ({ bind: () => ({ all: async () => ({ results: [product] }) }) }) };
  const q = await quote(db, [{ id: 1, option: 'Noir / XL', qty: 2 }, { id: 1, option: 'Vert / M', qty: 1 }], 'Rabat', {});
  assert.equal(q.lines.length, 1);
  assert.equal(q.lines[0].price, 250);
  assert.equal(q.total, 500);
  assert.deepEqual(q.issues, [{ id: 1, issue: 'option' }]);
});
