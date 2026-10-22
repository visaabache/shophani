// Storefront script: the cart (kept in localStorage), add-to-cart, the cart page and checkout.
// Prices shown in the cart always come from the server (/api/quote), never from localStorage.
(() => {
  const KEY = 'cart.v1';
  const i18n = JSON.parse(document.getElementById('i18n')?.textContent || '{}');
  const lang = i18n.lang || document.documentElement.lang || 'fr';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function money(n) {
    const d = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' ');
    return lang === 'ar' ? `${d} درهم` : lang === 'en' ? `MAD ${d}` : `${d} DH`;
  }

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
  function badge() {
    const n = load().reduce((s, i) => s + (i.qty || 0), 0);
    $$('.cart-count').forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  let toastTimer;
  function toast(text) {
    const el = $('.toast');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2200);
  }

  function add(item) {
    const items = load();
    const same = items.find((i) => i.id === item.id && (i.option || '') === (item.option || ''));
    if (same) same.qty = Math.min(20, same.qty + item.qty);
    else items.push(item);
    save(items);
  }

  // Product page: quantity steppers, add to cart, order now.
  $$('.qty').forEach((box) => {
    const input = $('input', box);
    box.addEventListener('click', (e) => {
      const step = Number(e.target.closest('[data-step]')?.dataset.step || 0);
      if (!step) return;
      const max = Number(input.max) || 20;
      input.value = Math.min(max, Math.max(1, (Number(input.value) || 1) + step));
    });
  });

  $$('form.buy').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const go = e.submitter?.value || 'cart';
      const options = $$('input[name=option]', form);
      const chosen = options.find((o) => o.checked);
      if (options.length && !chosen) {
        toast(i18n.chooseOption);
        $('.options', form)?.classList.add('shake');
        setTimeout(() => $('.options', form)?.classList.remove('shake'), 500);
        return;
      }
      add({
        id: Number(form.dataset.product),
        option: chosen ? chosen.value : '',
        qty: Math.max(1, Math.min(20, Number(form.qty.value) || 1)),
        name: form.dataset.name,
        price: Number(form.dataset.price),
        image: form.dataset.image,
        slug: form.dataset.slug,
      });
      if (go === 'checkout') location.href = `/${lang}/checkout`;
      else toast(i18n.added);
    });
  });

  // Gallery dots follow the swipe.
  $$('.gallery').forEach((g) => {
    const track = $('.gallery-track', g);
    const dots = $$('.dots span', g);
    if (!dots.length) return;
    const update = () => {
      const i = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      dots.forEach((d, j) => d.classList.toggle('on', i === j));
    };
    track.addEventListener('scroll', update, { passive: true });
    update();
  });

  // Cart page and checkout summary.
  const box = $('#cart');
  const checkout = $('#checkout');
  let lastQuote = null;

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

  function render(q) {
    lastQuote = q;
    const view = box.dataset.view;
    if (!q.lines.length) {
      box.innerHTML = `<p class="empty">${esc(i18n.emptyCart)}</p><p class="center"><a class="btn" href="/${lang}/shop">←</a></p>`;
      if (checkout) $('button[type=submit]', checkout).disabled = true;
      return;
    }
    const editable = view === 'cart';
    const lines = q.lines
      .map(
        (l, idx) => `<li class="line" data-idx="${idx}">
        <a href="/${lang}/p/${esc(l.slug)}"><img src="${esc(l.image)}" alt="" width="72" height="72"></a>
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
    const freeHint = q.freeOver && q.subtotal < q.freeOver ? `<p class="hint">${esc(i18n.freeOverText.replace('{amount}', money(q.freeOver)))}</p>` : '';
    box.innerHTML = `<ul class="lines">${lines}</ul>
      <ul class="totals">
        <li><span>${esc(i18n.subtotal)}</span><span>${money(q.subtotal)}</span></li>
        <li><span>${esc(i18n.shipping)}</span><span>${shipping}</span></li>
        <li class="total"><span>${esc(i18n.total)}</span><span>${money(cityKnown || !q.shipping ? q.total : q.subtotal)}</span></li>
      </ul>${freeHint}
      ${editable ? `<a class="btn btn-block btn-accent" href="/${lang}/checkout">${esc(i18n.checkout)}</a>` : ''}`;
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
    const phoneOk =(v) => /^(?:(?:\+|00)212|0)?[5-7]\d{8}$/.test(v.replace(/[\s.\-()]/g, ''));

    checkout.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = checkout;
      const err = $('.form-error', f);
      err.hidden = true;
      let bad = null;
      for (const [input, ok, msg] of [
        [f.name, f.name.value.trim().length >= 2, i18n.required],
        [f.phone, phoneOk(f.phone.value), i18n.badPhone],
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
        } else if (res.status === 422 && data.fields) {
          for (const [k, v] of Object.entries(data.fields)) if (f[k]) fieldError(f[k], v === 'phone' ? i18n.badPhone : i18n.required);
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

  badge();
  window.addEventListener('storage', badge);
})();
