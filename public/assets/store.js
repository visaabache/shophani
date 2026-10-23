// Storefront script: the cart (kept in localStorage), add-to-cart, the cart page and checkout,
// plus the home slideshow, the product gallery and scroll reveals.
// Prices shown in the cart always come from the server (/api/quote), never from localStorage.
(() => {
  document.documentElement.classList.add('js');
  const KEY = 'cart.v1';
  const i18n = JSON.parse(document.getElementById('i18n')?.textContent || '{}');
  const lang = i18n.lang || document.documentElement.lang || 'fr';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function money(n) {
    const d = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' ');
    return lang === 'ar' ? `${d} درهم` : lang === 'en' ? `MAD ${d}` : `${d} DH`;
  }
  const small = (url) => (/^\/assets\/photos\/[a-z0-9-]+\.webp$/.test(url) && !url.endsWith('-sm.webp') ? url.replace(/\.webp$/, '-sm.webp') : url);

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
    badge();
  }
  function badge(bump) {
    const n = load().reduce((s, i) => s + (i.qty || 0), 0);
    $$('.cart-count').forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
      if (bump) {
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
      }
    });
  }

  let toastTimer;
  function toast(text, withCartLink) {
    const el = $('.toast');
    if (!el) return;
    el.innerHTML = `<span>${esc(text)}</span>${withCartLink ? `<a href="/${lang}/cart">${esc(i18n.viewCart)}</a>` : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2800);
  }

  function add(item) {
    const items = load();
    const same = items.find((i) => i.id === item.id && (i.option || '') === (item.option || ''));
    if (same) same.qty = Math.min(20, same.qty + item.qty);
    else items.push(item);
    save(items);
    badge(true);
  }

  // Scroll reveals.
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  // Home slideshow.
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.slide', hero);
    const dots = $$('.hero-dots button', hero);
    let at = 0;
    let timer;
    const show = (i) => {
      at = (i + slides.length) % slides.length;
      slides.forEach((s, j) => {
        s.classList.toggle('on', j === at);
        s.setAttribute('aria-hidden', String(j !== at));
        $$('a', s).forEach((a) => (a.tabIndex = j === at ? 0 : -1));
        if (j === at) $$('img[loading=lazy]', s).forEach((img) => (img.loading = 'eager'));
      });
      dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === at)));
    };
    const start = () => {
      clearInterval(timer);
      if (!reduceMotion && slides.length > 1) timer = setInterval(() => show(at + 1), 6500);
    };
    dots.forEach((d, i) =>
      d.addEventListener('click', () => {
        show(i);
        start();
      }),
    );
    let x0 = null;
    hero.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) {
        show(at + ((dx < 0) !== (document.dir === 'rtl') ? 1 : -1));
        start();
      }
      x0 = null;
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : start()));
    start();
  }

  // Sorting on listings.
  $$('[data-autosubmit]').forEach((s) => s.addEventListener('change', () => s.form.submit()));

  // Quick add (products without options).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    add({ id: Number(b.dataset.add), option: '', qty: 1, name: b.dataset.name, price: Number(b.dataset.price), image: b.dataset.image, slug: b.dataset.slug });
    b.classList.add('done');
    setTimeout(() => b.classList.remove('done'), 1200);
    toast(i18n.added, true);
  });

  // Product page: quantity steppers, add to cart, order now.
  $$('.qty').forEach((box) => {
    const input = $('input', box);
    if (!input) return;
    box.addEventListener('click', (e) => {
      const step = Number(e.target.closest('[data-step]')?.dataset.step || 0);
      if (!step) return;
      const max = Number(input.max) || 20;
      input.value = Math.min(max, Math.max(1, (Number(input.value) || 1) + step));
    });
  });

  function submitBuy(form, go) {
    const options = $$('input[name=option]', form);
    const chosen = options.find((o) => o.checked);
    if (options.length && !chosen) {
      toast(i18n.chooseOption);
      const fs = $('.options', form);
      fs.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      fs.classList.add('shake');
      setTimeout(() => fs.classList.remove('shake'), 500);
      return;
    }
    const item = {
      id: Number(form.dataset.product),
      option: chosen ? chosen.value : '',
      qty: Math.max(1, Math.min(20, Number(form.qty.value) || 1)),
      name: form.dataset.name,
      price: Number(form.dataset.price),
      image: form.dataset.image,
      slug: form.dataset.slug,
    };
    add(item);
    window.shTrack?.('AddToCart', { value: item.price * item.qty, items: [item] });
    if (go === 'checkout') location.href = `/${lang}/checkout`;
    else toast(i18n.added, true);
  }

  $$('form.buy').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitBuy(form, e.submitter?.value || 'cart');
    });
    // Sticky "order now" bar on phones once the buy buttons scroll out of view.
    const bar = $('.buy-bar');
    if (bar) {
      $('[data-buy-now]', bar).addEventListener('click', () => submitBuy(form, 'checkout'));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
          const show = !e.isIntersecting && e.boundingClientRect.top < 0;
          bar.classList.toggle('show', show);
          document.body.classList.toggle('bar-up', show);
        }).observe(form);
      }
    }
  });

  // Gallery: thumbnails and swipe.
  $$('.gallery').forEach((g) => {
    const track = $('.gallery-track', g);
    const thumbs = $$('.thumbs button', g);
    if (!thumbs.length) return;
    const width = () => track.clientWidth;
    thumbs.forEach((b) =>
      b.addEventListener('click', () => {
        const i = Number(b.dataset.go);
        track.scrollTo({ left: (document.dir === 'rtl' ? -1 : 1) * i * width(), behavior: reduceMotion ? 'auto' : 'smooth' });
      }),
    );
    track.addEventListener(
      'scroll',
      () => {
        const i = Math.round(Math.abs(track.scrollLeft) / width());
        thumbs.forEach((b, j) => b.classList.toggle('on', i === j));
      },
      { passive: true },
    );
  });

  // Cart page and checkout summary.
  const box = $('#cart');
  const checkout = $('#checkout');
  let lastQuote = null;
  if (checkout && load().length) {
    const items = load();
    window.shTrack?.('InitiateCheckout', { value: items.reduce((n, i) => n + i.price * i.qty, 0), items });
  }

  async function fetchQuote(city) {
    const items = load().map(({ id, option, qty }) => ({ id, option, qty }));
    const res = await fetch(`/api/quote?lang=${lang}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items, city: city || '' }),
    });
    if (!res.ok) throw new Error('quote');
    const q = await res.json();
    // Keep the browser's cart in step with what the server accepted.
    save(q.lines.map((l) => ({ id: l.id, option: l.option, qty: l.qty, name: l.name, price: l.price, image: l.image, slug: l.slug })));
    if (q.issues.some((i) => i.issue !== 'qty')) toast(i18n.issueStock);
    else if (q.issues.length) toast(i18n.issueQty);
    return q;
  }

  function selectedCity() {
    if (!checkout) return '';
    const v = checkout.city.value;
    return v === '__other' ? checkout.city_other.value.trim() : v;
  }

  const STAR = '<svg class="burst-star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5 14.6 5h4.4v4.4L22.5 12 19 14.6V19h-4.4L12 22.5 9.4 19H5v-4.4L1.5 12 5 9.4V5h4.4L12 1.5Zm0 6a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>';

  function render(q) {
    lastQuote = q;
    const view = box.dataset.view;
    if (!q.lines.length) {
      box.innerHTML = `<div class="cart-empty">${STAR}<p>${esc(i18n.emptyCart)}</p><a class="btn btn-accent" href="/${lang}/shop">${esc(i18n.startShopping)}</a></div>`;
      if (checkout) $('button[type=submit]', checkout).disabled = true;
      return;
    }
    const editable = view === 'cart';
    const lines = q.lines
      .map(
        (l, idx) => `<li class="line" data-idx="${idx}" style="animation-delay:${idx * 50}ms">
        <a href="/${lang}/p/${esc(l.slug)}"><img src="${esc(small(l.image))}" alt="" width="76" height="95"></a>
        <div class="line-info">
          <a href="/${lang}/p/${esc(l.slug)}">${esc(l.name)}</a>
          ${l.option ? `<small>${esc(l.option)}</small>` : ''}
          ${editable ? `<div class="qty small"><button type="button" data-d="-1" aria-label="−">−</button><span>${l.qty}</span><button type="button" data-d="1" aria-label="+">+</button></div>` : `<small>× ${l.qty}</small>`}
        </div>
        <div class="line-end"><strong>${money(l.total)}</strong>${editable ? `<button type="button" class="link" data-remove>${esc(i18n.remove)}</button>` : ''}</div>
      </li>`,
      )
      .join('');
    const cityKnown = view === 'cart' ? false : Boolean(selectedCity());
    const shipping = !cityKnown && q.shipping > 0 ? esc(i18n.shippingAfterCity) : q.shipping ? money(q.shipping) : esc(i18n.free);
    let meter = '';
    if (q.freeOver) {
      const pct = Math.min(100, Math.round((q.subtotal / q.freeOver) * 100));
      const label = q.subtotal >= q.freeOver ? i18n.freeReached : i18n.freeLeft.replace('{amount}', money(q.freeOver - q.subtotal));
      meter = `<div class="free-meter">${esc(label)}<div class="bar"><span style="width:${pct}%"></span></div></div>`;
    }
    box.innerHTML = `<ul class="lines">${lines}</ul>
      ${meter}
      <ul class="totals">
        <li><span>${esc(i18n.subtotal)}</span><span>${money(q.subtotal)}</span></li>
        <li><span>${esc(i18n.shipping)}</span><span>${shipping}</span></li>
        <li class="total"><span>${esc(i18n.total)}</span><span>${money(cityKnown || !q.shipping ? q.total : q.subtotal)}</span></li>
      </ul>
      ${editable ? `<a class="btn btn-block btn-accent btn-lg" href="/${lang}/checkout">${esc(i18n.checkout)}</a>` : ''}`;
    if (checkout) $('button[type=submit]', checkout).disabled = false;
  }

  async function refresh() {
    try {
      render(await fetchQuote(selectedCity()));
    } catch {
      box.innerHTML = `<p class="form-error">${esc(i18n.error)}</p>`;
    }
  }

  if (box) {
    box.addEventListener('click', (e) => {
      const li = e.target.closest('.line');
      if (!li || !lastQuote) return;
      const items = load();
      const idx = Number(li.dataset.idx);
      if (e.target.closest('[data-remove]')) items.splice(idx, 1);
      const d = Number(e.target.closest('[data-d]')?.dataset.d || 0);
      if (d && items[idx]) {
        items[idx].qty += d;
        if (items[idx].qty < 1) items.splice(idx, 1);
      }
      save(items);
      refresh();
    });
    refresh();
  }

  if (checkout) {
    const other = $('.other-city', checkout);
    checkout.city.addEventListener('change', () => {
      other.hidden = checkout.city.value !== '__other';
      refresh();
    });
    checkout.city_other.addEventListener('change', refresh);

    const fieldError = (input, msg) => {
      const label = input.closest('label');
      let p = label.querySelector('.field-error');
      if (!msg) return p?.remove();
      if (!p) {
        p = document.createElement('span');
        p.className = 'field-error';
        label.append(p);
      }
      p.textContent = msg;
    };
    checkout.addEventListener('input', (e) => e.target.closest('label')?.querySelector('.field-error')?.remove());
    const phoneOk = (v) => /^(?:(?:\+|00)212|0)?[5-7]\d{8}$/.test(v.replace(/[\s.\-()]/g, ''));

    checkout.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = checkout;
      const err = $('.form-error', f);
      err.hidden = true;
      let bad = null;
      for (const [input, ok, msg] of [
        [f.name, f.name.value.trim().length >= 2, i18n.required],
        [f.phone, phoneOk(f.phone.value), i18n.badPhone],
        [f.email, !f.email.value.trim() || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(f.email.value.trim()), i18n.badEmail],
        [f.city, Boolean(selectedCity()), i18n.required],
        [f.address, f.address.value.trim().length >= 4, i18n.required],
      ]) {
        fieldError(input, ok ? '' : msg);
        if (!ok && !bad) bad = input;
      }
      if (bad) return bad.focus();
      const btn = $('button[type=submit]', f);
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = i18n.sending;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            items: load().map(({ id, option, qty }) => ({ id, option, qty })),
            name: f.name.value,
            phone: f.phone.value,
            email: f.email.value,
            city: selectedCity(),
            address: f.address.value,
            note: f.note.value,
            website: f.website.value,
            lang,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 201) {
          save([]);
          location.href = data.url;
          return;
        }
        if (res.status === 409) {
          await refresh();
        } else if (res.status === 429) {
          err.textContent = i18n.tooMany;
          err.hidden = false;
        } else if (res.status === 422 && data.fields) {
          for (const [k, v] of Object.entries(data.fields)) if (f[k]) fieldError(f[k], v === 'phone' ? i18n.badPhone : v === 'email' ? i18n.badEmail : i18n.required);
        } else {
          err.textContent = i18n.error;
          err.hidden = false;
        }
      } catch {
        err.textContent = i18n.error;
        err.hidden = false;
      }
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  // WhatsApp button: a small panel of ready-made messages instead of jumping straight to the app.
  const wa = $('[data-wa]');
  if (wa) {
    const panel = $('.wa-panel', wa);
    const toggle = $('[data-wa-toggle]', wa);
    const setOpen = (open) => {
      panel.hidden = !open;
      wa.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        try { localStorage.setItem('wa_seen', '1'); } catch {}
        wa.classList.add('seen');
        $('.wa-chips a', panel)?.focus({ preventScroll: true });
      }
    };
    try { if (localStorage.getItem('wa_seen')) wa.classList.add('seen'); } catch {}
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(panel.hidden);
    });
    $('[data-wa-close]', wa).addEventListener('click', () => { setOpen(false); toggle.focus(); });
    $$('a', panel).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (!panel.hidden && !wa.contains(e.target)) setOpen(false); });
  }

  // Hide floating buttons while the keyboard is up, so they never sit on top of a text box.
  const typing = (e) => e.target.matches?.('input:not([type=radio]):not([type=checkbox]), textarea, select');
  document.addEventListener('focusin', (e) => { if (typing(e)) document.body.classList.add('typing'); });
  document.addEventListener('focusout', (e) => { if (typing(e)) document.body.classList.remove('typing'); });

  // Search tab: focus the shop's search box (on the shop page the tap itself opens the keyboard).
  $$('[data-search-tab]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const q = $('#q');
      if (q) {
        e.preventDefault();
        q.scrollIntoView({ block: 'center' });
        q.focus();
      }
    }),
  );
  if (location.hash === '#q') $('#q')?.focus({ preventScroll: true });

  // Product page: expected delivery window (24 to 72 h from today).
  $$('[data-eta]').forEach((el) => {
    const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-GB' : 'fr-MA', { weekday: 'short', day: 'numeric', month: 'short' });
    const day = (n) => fmt.format(new Date(Date.now() + n * 86400000));
    el.textContent = (i18n.eta || '').replace('{a}', day(1)).replace('{b}', day(3));
    el.hidden = false;
  });
  $$('[data-copy]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast(i18n.copied);
      } catch {
        toast(b.dataset.copy);
      }
    }),
  );

  badge();
  window.addEventListener('storage', () => badge());
})();
