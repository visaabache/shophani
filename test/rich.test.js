import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, richDescHtml, htmlToText } from '../src/lib.js';

test('rich descriptions keep formatting and media', () => {
  const html = '<h2>Titre</h2><p style="text-align: center;">Un <b>très</b> bon <i>produit</i></p><ul><li>A</li></ul><p><img src="/img/p/a.webp" alt="x"></p><video src="/img/v/b.mp4"></video><p><a href="https://example.com">lien</a></p>';
  const out = sanitizeHtml(html);
  assert.match(out, /<h2>Titre<\/h2>/);
  assert.match(out, /<p style="text-align:center">Un <strong>très<\/strong> bon <em>produit<\/em><\/p>/);
  assert.match(out, /<img src="\/img\/p\/a.webp" alt="x" loading="lazy">/);
  assert.match(out, /<video src="\/img\/v\/b.mp4#t=0.1" controls playsinline preload="metadata"><\/video>/);
  assert.match(out, /<a href="https:\/\/example.com" target="_blank" rel="noopener nofollow">lien<\/a>/);
});

test('rich descriptions cannot run scripts', () => {
  const bad = [
    '<script>alert(1)</script>ok',
    '<img src=x onerror=alert(1)>',
    '<img src="javascript:alert(1)">',
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt&#58;alert(1)">x</a>',
    '<p onclick="alert(1)" style="background:url(javascript:alert(1))">x</p>',
    '<svg><script>alert(1)</script></svg>',
    '<iframe src="https://evil.test"></iframe>',
    '<video src="https://ok.test/a.mp4" onplay="alert(1)"></video>',
    '<<script>alert(1)//<</script>',
    '<p>a</p><style>body{display:none}</style>',
    '<img src="/img/a.webp"/onerror=alert(1)>',
  ];
  for (const b of bad) {
    const out = sanitizeHtml(b);
    assert.doesNotMatch(out, /<(script|iframe|svg|style)|<[^>]*\s(on\w+|style="[^"]*url)|(href|src)="\s*javascript:/i, b + ' → ' + out);
  }
  assert.equal(sanitizeHtml('<script>alert(1)</script>ok'), 'ok');
});

test('old plain-text descriptions still show line breaks', () => {
  assert.equal(richDescHtml('Ligne 1\nLigne <2>'), 'Ligne 1<br>Ligne &lt;2&gt;');
  assert.equal(htmlToText('<p>Bonjour&nbsp;<b>toi</b></p><p>Deux</p>'), 'Bonjour toi Deux');
});

test('cleaning twice gives the same result', () => {
  const once = sanitizeHtml('<h1>T</h1><div style="text-align:right">x <font color="#e11d48">rouge</font></div><video src="/img/v/a.mp4"></video><img src="/img/p/b.gif">');
  assert.equal(sanitizeHtml(once), once);
});

test('photos and videos keep the size the admin picked', () => {
  const out = sanitizeHtml('<img src="/img/p/a.webp" style="width: 50%; float:left"><video src="/img/v/b.mp4" style="width:75%"></video><img src="/img/p/c.webp" style="width:100%"><img src="/img/p/d.webp" style="width:5%;height:9999px">');
  assert.match(out, /<img src="\/img\/p\/a.webp" alt="" style="width:50%" loading="lazy">/);
  assert.match(out, /<video src="\/img\/v\/b.mp4#t=0.1" style="width:75%" controls/);
  assert.match(out, /<img src="\/img\/p\/c.webp" alt="" loading="lazy">/);
  assert.match(out, /<img src="\/img\/p\/d.webp" alt="" loading="lazy">/);
  assert.equal(sanitizeHtml(out), out);
});

test('photos keep the shape the admin dragged them to', () => {
  const out = sanitizeHtml('<img src="/img/p/a.webp" style="width:60%;aspect-ratio:1.5"><img src="/img/p/b.webp" style="aspect-ratio: 16 / 9"><img src="/img/p/c.webp" style="aspect-ratio:50;width:40%">');
  assert.match(out, /<img src="\/img\/p\/a.webp" alt="" style="width:60%;aspect-ratio:1.5" loading="lazy">/);
  assert.match(out, /<img src="\/img\/p\/b.webp" alt="" style="aspect-ratio:1.778" loading="lazy">/);
  assert.match(out, /<img src="\/img\/p\/c.webp" alt="" style="width:40%" loading="lazy">/);
  assert.equal(sanitizeHtml(out), out);
});

test('alignment and text size survive, also from Safari and pasted text', () => {
  const out = sanitizeHtml('<div style="text-align:center"><p>Un</p><p>Deux</p></div><div align="center">Trois</div><p><font size="5" color="#e11d48">Grand</font> <span style="font-size:1.35em">aussi</span> <span style="font-size:40px">non</span></p>');
  assert.match(out, /<div style="text-align:center"><p>Un<\/p><p>Deux<\/p><\/div>/);
  assert.match(out, /<div style="text-align:center">Trois<\/div>/);
  assert.match(out, /<span style="color:#e11d48;font-size:1.35em">Grand<\/span>/);
  assert.match(out, /<span style="font-size:1.35em">aussi<\/span>/);
  assert.match(out, /<span>non<\/span>/);
  assert.equal(sanitizeHtml(out), out);
});
