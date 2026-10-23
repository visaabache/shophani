// Facebook (Meta) and TikTok pixels. Loaded only when a pixel ID is set in the admin, and only after
// the visitor accepts advertising cookies (law 09-08). Until then events wait in a queue.
(() => {
  const cfg = JSON.parse(document.getElementById('pixels')?.textContent || 'null');
  const queue = [];
  let ready = false;
  window.shTrack = (name, data) => (ready ? send(name, data) : queue.push([name, data]));
  if (!cfg || (!cfg.meta && !cfg.tiktok)) return;

  const KEY = 'consent.ads';
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch {} };
  const addScript = (src) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };

  function load() {
    if (ready) return;
    if (cfg.meta) {
      const f = (window.fbq = function () {
        f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments);
      });
      if (!window._fbq) window._fbq = f;
      f.push = f;
      f.loaded = true;
      f.version = '2.0';
      f.queue = [];
      addScript('https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', cfg.meta);
      fbq('track', 'PageView');
    }
    if (cfg.tiktok) {
      const ttq = (window.ttq = window.ttq || []);
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      ttq.setAndDefer = (t, e) => { t[e] = function () { t.push([e].concat([].slice.call(arguments, 0))); }; };
      ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m));
      ttq.instance = (t) => { const e = ttq._i[t] || []; ttq.methods.forEach((m) => ttq.setAndDefer(e, m)); return e; };
      ttq.load = (e, n) => {
        const r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        addScript(`${r}?sdkid=${encodeURIComponent(e)}&lib=ttq`);
      };
      ttq.load(cfg.tiktok);
      ttq.page();
    }
    ready = true;
    if (cfg.page) send(cfg.page.event, cfg.page);
    queue.splice(0).forEach(([n, d]) => send(n, d));
  }

  // One shape for our events, translated to each platform's standard names. Prices are in MAD.
  function send(name, d = {}) {
    const items = d.items || [];
    const value = Number(d.value) || 0;
    const ids = items.map((i) => String(i.id));
    const numItems = items.reduce((n, i) => n + (Number(i.qty) || 1), 0);
    const fb = window.fbq, tt = window.ttq;
    const ttContents = items.map((i) => ({ content_id: String(i.id), content_name: i.name, price: Number(i.price) || 0, quantity: Number(i.qty) || 1 }));
    if (name === 'ViewContent' || name === 'AddToCart') {
      fb?.('track', name, { content_ids: ids, content_type: 'product', content_name: items[0]?.name, value, currency: 'MAD' });
      tt?.track(name, { contents: ttContents, content_type: 'product', value, currency: 'MAD' });
    } else if (name === 'InitiateCheckout') {
      fb?.('track', 'InitiateCheckout', { content_ids: ids, num_items: numItems, value, currency: 'MAD' });
      tt?.track('InitiateCheckout', { contents: ttContents, content_type: 'product', value, currency: 'MAD' });
    } else if (name === 'Purchase') {
      // Count each order once, even if the confirmation page is opened again.
      const key = `px.order.${d.id}`;
      try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch {}
      fb?.('track', 'Purchase', { content_ids: ids, content_type: 'product', num_items: numItems, value, currency: 'MAD' }, { eventID: String(d.id) });
      tt?.track('PlaceAnOrder', { contents: ttContents, content_type: 'product', value, currency: 'MAD' }, { event_id: String(d.id) });
    }
  }

  const banner = document.getElementById('consent');
  const show = () => { if (banner) banner.hidden = false; };
  banner?.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    write(choice);
    banner.hidden = true;
    if (choice === 'yes') load();
    else if (ready) location.reload(); // withdrawing consent: reload without the pixels
  });
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', show));

  const saved = read();
  if (saved === 'yes') load();
  else if (saved !== 'no') show();
})();
