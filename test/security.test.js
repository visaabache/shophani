import { test } from 'node:test';
import assert from 'node:assert/strict';
import { looksLikeImage, sameOrigin } from '../src/lib.js';

const bytes = (...a) => new Uint8Array([...a, ...new Array(16).fill(0)]).buffer;
const str = (s) => [...s].map((c) => c.charCodeAt(0));

test('uploads must really be images', () => {
  assert.ok(looksLikeImage(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg'));
  assert.ok(looksLikeImage(bytes(0x89, ...str('PNG')), 'image/png'));
  assert.ok(looksLikeImage(bytes(...str('RIFF'), 0, 0, 0, 0, ...str('WEBP')), 'image/webp'));
  assert.ok(looksLikeImage(bytes(...str('GIF89a')), 'image/gif'));
  assert.ok(!looksLikeImage(bytes(...str('<svg onload=alert(1)>')), 'image/png'));
  assert.ok(!looksLikeImage(bytes(...str('<html>')), 'image/jpeg'));
  assert.ok(!looksLikeImage(bytes(0x89, ...str('PNG')), 'image/svg+xml'));
});

test('writes from other sites are refused', () => {
  const url = new URL('https://shop.test/api/orders');
  const req = (origin) => new Request(url, { method: 'POST', headers: origin ? { origin } : {} });
  assert.ok(sameOrigin(req('https://shop.test'), url));
  assert.ok(sameOrigin(req(''), url));
  assert.ok(!sameOrigin(req('https://evil.test'), url));
});
