// Store admin (in French): dashboard, orders, products, categories and settings. Talks to /api/admin/*.
// Pages are addressed by the URL hash (#dashboard, #orders, #order-12…) so links and the back button work.
(() => {
  const app = document.getElementById('app');
  const STATUS = { new: 'Nouvelle', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', returned: 'Retournée' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const dh = (n) => `${num(n)} DH`;
  const date = (s) => new Date(`${s.replace(' ', 'T')}Z`);
  const when = (s) => date(s).toLocaleString('fr-MA', { dateStyle: 'short', timeStyle: 'short' });
  const ago = (s) => {
    const min = Math.round((Date.now() - date(s)) / 60000);
    if (min < 1) return 'à l’instant';
    if (min < 60) return `il y a ${min} min`;
    if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
    return `il y a ${Math.round(min / 1440)} j`;
  };
  let state = { page: 'dashboard', status: '', q: '', images: false, emails: false, settings: {}, categories: [] };

  // Line icons, 24×24, stroke = currentColor.
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    products: '<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    categories: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
  };
  const icon = (n, s = 20) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  let toastTimer;
  function toast(text, bad) {
    const el = document.querySelector('.toast');
    el.textContent = text;
    el.className = `toast${bad ? ' bad' : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3000);
  }

  async function api(path, { method = 'GET', body, raw } = {}) {
    const res = await fetch(`/api/admin${path}`, {
      method,
      headers: raw ? { 'content-type': raw.type } : body ? { 'content-type': 'application/json' } : {},
      body: raw || (body ? JSON.stringify(body) : undefined),
      credentials: 'same-origin',
    });
    if (res.status === 401 && path !== '/login') {
      login();
      throw new Error('unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const messages = {
        wrong_password: 'Mot de passe incorrect.',
        slug_taken: 'Cette adresse (slug) est déjà utilisée.',
        name_required: 'Ajoutez au moins un nom.',
        price_required: 'Indiquez un prix.',
        not_enough_stock: 'Stock insuffisant pour rouvrir cette commande.',
        bad_shipping_rates: 'Tarifs par ville : format JSON invalide.',
        no_r2: 'Le stockage des photos (R2) n’est pas configuré.',
        too_large: 'Photo trop lourde (5 Mo max).',
        bad_type: 'Format de photo non pris en charge.',
        no_email_key: 'La clé Brevo n’est pas encore installée (voir les étapes ci-dessous).',
        no_email_from: 'Indiquez l’adresse d’envoi (vérifiée dans Brevo).',
        no_notify_email: 'Indiquez l’adresse qui reçoit les alertes.',
        email_failed: `Brevo a refusé l’envoi. ${data.detail || ''}`,
      };
      throw new Error(messages[data.error] || data.error || `Erreur ${res.status}`);
    }
    return data;
  }

  // Login
  function login() {
    document.body.className = 'is-login';
    app.innerHTML = `<form class="login" id="login">
      <img src="/admin/logo.svg" alt="Shophani" class="login-logo">
      <h1>Espace vendeur</h1>
      <p class="muted">Connectez-vous pour gérer vos commandes.</p>
      <label>Mot de passe<input type="password" name="password" autocomplete="current-password" required autofocus></label>
      <button class="btn btn-lg">Se connecter</button>
      <p class="error" hidden></p>
    </form>`;
    const f = document.getElementById('login');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/login', { method: 'POST', body: { password: f.password.value } });
        start();
      } catch (err) {
        const p = f.querySelector('.error');
        p.textContent = err.message;
        p.hidden = false;
      }
    });
  }

  const SHORT = { dashboard: 'Accueil' };
  const NAV = { dashboard: 'Tableau de bord', orders: 'Commandes', products: 'Produits', categories: 'Catégories', settings: 'Réglages' };

  function shell(title, content, { actions = '', sub = '' } = {}) {
    document.body.className = '';
    const nav = Object.entries(NAV)
      .map(([k, v]) => `<a href="#${k}" class="nav-item${state.page === k ? ' on' : ''}">${icon(k)}<span>${v}</span><span class="short">${SHORT[k] || v}</span>${k === 'orders' && state.pending ? `<b class="nav-badge">${state.pending}</b>` : ''}</a>`)
      .join('');
    app.innerHTML = `<aside class="side">
        <a href="#dashboard" class="side-logo"><img src="/admin/logo-dark.svg" alt="${esc(state.settings.store_name || 'Shophani')}"></a>
        <nav class="side-nav">${nav}</nav>
        <div class="side-foot">
          <a href="/fr/" target="_blank" rel="noopener" class="nav-item">${icon('external')}<span>Voir la boutique</span></a>
          <button class="nav-item" data-logout>${icon('logout')}<span>Déconnexion</span></button>
        </div>
      </aside>
      <div class="page">
        <header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="head-actions">${actions}</div></header>
        <main class="page-body">${content}</main>
      </div>
      <nav class="tabbar">${nav}</nav>`;
  }

  app.addEventListener('click', async (e) => {
    if (e.target.closest('[data-logout]')) {
      await api('/logout', { method: 'POST', body: {} });
      login();
    }
  });
  window.addEventListener('hashchange', route);

  async function start() {
    try {
      const me = await api('/me');
      state.images = me.images;
      state.emails = me.emails;
      state.settings = (await api('/settings')).settings;
      state.categories = (await api('/categories')).categories;
      route();
    } catch (err) {
      if (err.message !== 'unauthorized') app.innerHTML = `<p class="error pad">${esc(err.message)}</p>`;
    }
  }

  function route() {
    const h = location.hash.slice(1) || 'dashboard';
    const m = h.match(/^order-(\d+)$/);
    if (m) {
      if (state.page !== 'orders') {
        state.page = 'orders';
        orders().then(() => orderDetail(m[1]));
      } else orderDetail(m[1]);
      return;
    }
    state.page = NAV[h] ? h : 'dashboard';
    ({ dashboard, orders, products, categories, settings })[state.page]();
    window.scrollTo(0, 0);
  }

  const loading = (title) => shell(title, '<div class="skeleton-grid"><div></div><div></div><div></div><div></div></div>');

  // Dashboard
  function trend(now, prev) {
    if (!prev) return now ? '<span class="trend up">Nouveau</span>' : '';
    const pct = Math.round(((now - prev) / prev) * 100);
    return `<span class="trend ${pct >= 0 ? 'up' : 'down'}">${icon(pct >= 0 ? 'up' : 'down', 14)}${Math.abs(pct)} %</span>`;
  }

  // Sales per day for the last 30 days: one series, bars with a hover tooltip.
  function salesChart(daily) {
    const byDay = Object.fromEntries(daily.map((d) => [d.d, d]));
    const days = [];
    const today = new Date(Date.now() + 3600e3);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today - i * 864e5).toISOString().slice(0, 10);
      days.push({ d, sales: byDay[d]?.sales || 0, orders: byDay[d]?.orders || 0 });
    }
    const max = Math.max(...days.map((d) => d.sales), 1);
    const nice = (() => {
      const p = 10 ** Math.floor(Math.log10(max));
      return [1, 2, 2.5, 5, 10].map((k) => k * p).find((v) => v >= max);
    })();
    const W = 720, H = 220, L = 52, B = 26, T = 10;
    const bw = (W - L) / days.length;
    const y = (v) => T + (H - T - B) * (1 - v / nice);
    const grid = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W}" y1="${y(nice * f)}" y2="${y(nice * f)}" class="grid"/><text x="${L - 8}" y="${y(nice * f) + 4}" class="axis" text-anchor="end">${num(nice * f)}</text>`).join('');
    const bars = days
      .map((d, i) => {
        const x = L + i * bw;
        const h = Math.max(d.sales ? 3 : 0, H - B - y(d.sales));
        const label = new Date(`${d.d}T12:00:00Z`).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' });
        return `<g class="bar" data-tip="${esc(label)} · ${dh(d.sales)} · ${d.orders} commande${d.orders > 1 ? 's' : ''}">
          <rect class="hit" x="${x}" y="${T}" width="${bw}" height="${H - T - B}"/>
          ${h ? `<path class="fill" d="M${x + 2} ${H - B} V${H - B - h + 4} q0 -4 4 -4 H${x + bw - 6} q4 0 4 4 V${H - B} Z"/>` : ''}
          ${i % 5 === 4 || i === 29 ? `<text x="${x + bw / 2}" y="${H - 6}" class="axis" text-anchor="middle">${esc(label)}</text>` : ''}
        </g>`;
      })
      .join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventes par jour sur 30 jours">${grid}<line x1="${L}" x2="${W}" y1="${H - B}" y2="${H - B}" class="base"/>${bars}</svg><div class="tip" hidden></div></div>`;
  }

  function wireTips(root) {
    root.querySelectorAll('.chart').forEach((c) => {
      const tip = c.querySelector('.tip');
      c.addEventListener('pointermove', (e) => {
        const g = e.target.closest('[data-tip]');
        if (!g) return (tip.hidden = true);
        c.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
        g.classList.add('on');
        tip.textContent = g.dataset.tip;
        tip.hidden = false;
        const r = c.getBoundingClientRect();
        tip.style.left = `${Math.min(Math.max(e.clientX - r.left, 80), r.width - 80)}px`;
        tip.style.top = `${e.clientY - r.top - 44}px`;
      });
      c.addEventListener('pointerleave', () => {
        tip.hidden = true;
        c.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
      });
    });
  }

  // Order pipeline for the last 30 days: one stacked bar, each status labelled in the legend.
  function pipeline(by) {
    const order = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
    const total = order.reduce((a, k) => a + (by[k] || 0), 0);
    if (!total) return '<p class="empty-small">Pas encore de commandes ce mois-ci.</p>';
    return `<div class="stack">${order.filter((k) => by[k]).map((k) => `<span class="seg s-${k}" style="flex:${by[k]}" title="${STATUS[k]} : ${by[k]}"></span>`).join('')}</div>
      <ul class="legend">${order.map((k) => `<li><i class="dot s-${k}"></i>${STATUS[k]}<b>${by[k] || 0}</b></li>`).join('')}</ul>`;
  }

  function hbars(rows, label, value, fmt) {
    if (!rows.length) return '<p class="empty-small">Rien à afficher pour l’instant.</p>';
    const max = Math.max(...rows.map(value), 1);
    return `<ul class="hbars">${rows.map((r) => `<li><span class="hb-label">${label(r)}</span><span class="hb-track"><span style="width:${(value(r) / max) * 100}%"></span></span><b>${fmt(r)}</b></li>`).join('')}</ul>`;
  }

  function emailCard() {
    const s = state.settings;
    const ready = state.emails && s.email_from;
    return `<section class="card email-card ${ready ? 'ok' : ''}">
      <div class="card-head"><h2>${icon('mail')} E-mails automatiques</h2><span class="chip ${ready ? 'chip-ok' : 'chip-warn'}">${ready ? 'Actifs' : 'À configurer'}</span></div>
      ${ready ? `<p class="muted">Confirmation au client et alerte à <strong>${esc(s.notify_email || s.contact_email || '—')}</strong> pour chaque commande.</p>` : '<p class="muted">Envoyez une confirmation à vos clients et recevez une alerte à chaque commande.</p>'}
      <a href="#settings" class="link-arrow">${ready ? 'Réglages des e-mails' : 'Configurer en 5 minutes'} ${icon('arrow', 16)}</a>
    </section>`;
  }

  async function dashboard() {
    loading(NAV.dashboard);
    const s = await api('/stats');
    state.pending = s.new_orders || 0;
    const aov = s.orders_30d - s.failed_30d > 0 ? s.sales_30d / (s.orders_30d - s.failed_30d) : 0;
    const closed = (s.delivered_30d || 0) + (s.failed_30d || 0);
    const rate = closed ? Math.round((s.delivered_30d / closed) * 100) : null;
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const today = new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' });
    shell(
      `${hello} 👋`,
      `${s.new_orders ? `<a href="#orders" class="callout" data-filter="new">${icon('alert')}<span><strong>${s.new_orders} commande${s.new_orders > 1 ? 's' : ''} à confirmer.</strong> Appelez ou écrivez sur WhatsApp avant d’expédier.</span>${icon('arrow', 18)}</a>` : ''}
      <section class="kpis">
        <div class="kpi kpi-hero"><span class="kpi-label">Ventes · 30 jours</span><strong class="kpi-value">${dh(s.sales_30d)}</strong>${trend(s.sales_30d || 0, s.sales_prev || 0)}<span class="kpi-foot">Aujourd’hui : ${dh(s.today_sales)}</span></div>
        <div class="kpi"><span class="kpi-label">Commandes · 30 j</span><strong class="kpi-value">${num(s.orders_30d)}</strong>${trend(s.orders_30d || 0, s.orders_prev || 0)}<span class="kpi-foot">Aujourd’hui : ${num(s.today)}</span></div>
        <div class="kpi"><span class="kpi-label">Panier moyen</span><strong class="kpi-value">${dh(aov)}</strong><span class="kpi-foot">hors annulées</span></div>
        <div class="kpi"><span class="kpi-label">Encaissé · 30 j</span><strong class="kpi-value">${dh(s.revenue_30d)}</strong><span class="kpi-foot">${rate == null ? 'commandes livrées' : `${rate} % livrées sur les clôturées`}</span></div>
      </section>
      <section class="grid-2">
        <div class="card span-2"><div class="card-head"><h2>Ventes par jour</h2><span class="muted small">30 derniers jours, en DH</span></div>${salesChart(s.daily)}</div>
        <div class="card"><div class="card-head"><h2>Suivi des commandes</h2><span class="muted small">30 jours</span></div>${pipeline(s.by_status)}</div>
        <div class="card"><div class="card-head"><h2>Villes</h2><span class="muted small">commandes, 30 j</span></div>${hbars(s.top_cities, (r) => esc(r.city), (r) => r.n, (r) => r.n)}</div>
        <div class="card"><div class="card-head"><h2>Meilleures ventes</h2><span class="muted small">30 jours</span></div>
          ${s.top_products.length ? `<ol class="top">${s.top_products.map((p, i) => `<li><span class="rank">${i + 1}</span><img src="${esc(p.image || '/assets/placeholder.svg')}" alt=""><span class="grow">${esc(p.name)}<small>${dh(p.sales)}</small></span><b>${p.qty}×</b></li>`).join('')}</ol>` : '<p class="empty-small">Vos produits les plus vendus apparaîtront ici.</p>'}
        </div>
        <div class="card"><div class="card-head"><h2>Dernières commandes</h2><a href="#orders" class="link-arrow">Tout voir ${icon('arrow', 16)}</a></div>
          ${s.recent.length ? `<ul class="recent">${s.recent.map((o) => `<li><a href="#order-${o.id}"><span class="avatar">${esc((o.name || '?').trim().charAt(0).toUpperCase())}</span><span class="grow"><strong>${esc(o.name)}</strong><small>${esc(o.city)} · ${ago(o.created_at)}</small></span><span class="end"><b>${dh(o.total)}</b><span class="status s-${o.status}">${STATUS[o.status]}</span></span></a></li>`).join('')}</ul>` : '<p class="empty-small">Aucune commande pour l’instant. Partagez le lien de votre boutique !</p>'}
        </div>
        ${s.low_stock.length ? `<div class="card"><div class="card-head"><h2>${icon('alert')} Stock bas</h2></div><ul class="recent">${s.low_stock.map((p) => `<li><a href="#products"><img class="thumb" src="${esc(JSON.parse(p.images || '[]')[0] || '/assets/placeholder.svg')}" alt=""><span class="grow"><strong>${esc(p.name_fr)}</strong></span><span class="chip ${p.stock ? 'chip-warn' : 'chip-bad'}">${p.stock ? `${p.stock} restant${p.stock > 1 ? 's' : ''}` : 'Épuisé'}</span></a></li>`).join('')}</ul></div>` : ''}
        ${emailCard()}
      </section>`,
      { sub: today.charAt(0).toUpperCase() + today.slice(1), actions: `<a class="btn ghost" href="/api/admin/orders.csv">${icon('download', 18)}<span>Export CSV</span></a>` },
    );
    app.querySelector('[data-filter]')?.addEventListener('click', () => (state.status = 'new'));
    wireTips(app);
  }

  // Orders
  async function orders() {
    loading(NAV.orders);
    const list = await api(`/orders?status=${state.status}&q=${encodeURIComponent(state.q)}`);
    state.pending = list.counts.new || 0;
    const all = Object.values(list.counts).reduce((a, b) => a + b, 0);
    const filters = [['', 'Toutes', all], ...Object.entries(STATUS).map(([k, v]) => [k, v, list.counts[k] || 0])];
    shell(
      NAV.orders,
      `<div class="toolbar">
        <div class="filters">${filters.map(([k, v, n]) => `<button class="pill${state.status === k ? ' on' : ''}" data-status="${k}">${k ? `<i class="dot s-${k}"></i>` : ''}${v}<span>${n}</span></button>`).join('')}</div>
        <form class="search" id="osearch">${icon('search', 18)}<input type="search" name="q" value="${esc(state.q)}" placeholder="N°, nom, téléphone, ville"></form>
      </div>
      ${list.orders.length ? `<div class="card flush"><table class="table"><thead><tr><th>Commande</th><th>Client</th><th class="hide-sm">Ville</th><th>Total</th><th>Statut</th></tr></thead><tbody>
        ${list.orders.map((o) => `<tr data-order="${o.id}"><td><span class="mono">${esc(o.number)}</span><small>${ago(o.created_at)}</small></td><td><strong>${esc(o.name)}</strong><small>${esc(o.phone_display)}${o.email ? ` · ${icon('mail', 13)}` : ''}</small></td><td class="hide-sm">${esc(o.city)}</td><td class="nowrap"><strong>${dh(o.total)}</strong></td><td><span class="status s-${o.status}">${STATUS[o.status] || o.status}</span></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="card empty">${icon('orders', 36)}<p>${state.q || state.status ? 'Aucune commande ne correspond.' : 'Aucune commande pour l’instant.'}</p></div>`}`,
      { sub: `${all} au total`, actions: `<a class="btn ghost" href="/api/admin/orders.csv?status=${state.status}">${icon('download', 18)}<span>Export CSV</span></a>` },
    );
    app.querySelectorAll('[data-status]').forEach((b) =>
      b.addEventListener('click', () => {
        state.status = b.dataset.status;
        orders();
      }),
    );
    document.getElementById('osearch').addEventListener('submit', (e) => {
      e.preventDefault();
      state.q = e.target.q.value.trim();
      orders();
    });
    app.querySelectorAll('[data-order]').forEach((tr) => tr.addEventListener('click', () => (location.hash = `order-${tr.dataset.order}`)));
  }

  function confirmMessage(o) {
    const store = state.settings.store_name || '';
    const total = o.lang === 'ar' ? `${o.total} درهم` : o.lang === 'en' ? `MAD ${o.total}` : `${o.total} DH`;
    if (o.lang === 'ar') return `السلام عليكم ${o.name}، شكرًا على طلبك رقم ${o.number} (${total}) من ${store}. هل تؤكد التوصيل إلى ${o.city}؟`;
    if (o.lang === 'en') return `Hello ${o.name}, thank you for your order ${o.number} (${total}) from ${store}. Can you confirm delivery to ${o.city}?`;
    return `Bonjour ${o.name}, merci pour votre commande ${o.number} (${total}) chez ${store}. Pouvez-vous confirmer la livraison à ${o.city} ?`;
  }

  async function orderDetail(id) {
    document.querySelector('dialog.drawer')?.close();
    const { order: o, items } = await api(`/orders/${id}`);
    const flow = ['new', 'confirmed', 'shipped', 'delivered'];
    const at = flow.indexOf(o.status);
    const emailNote = o.email && state.emails && state.settings.email_from && state.settings.email_status_updates !== '0';
    const dialog = document.createElement('dialog');
    dialog.className = 'drawer';
    dialog.innerHTML = `<form method="dialog" class="drawer-head"><div><p class="muted small">Commande · ${when(o.created_at)}</p><h2 class="mono">${esc(o.number)}</h2></div><button class="close" aria-label="Fermer">✕</button></form>
      <ol class="steps">${flow.map((k, i) => `<li class="${at >= i ? 'done' : ''}${o.status === k ? ' now' : ''}"><span>${at >= i ? icon('check', 12) : ''}</span>${STATUS[k]}</li>`).join('')}</ol>
      ${at < 0 ? `<p><span class="status s-${o.status}">${STATUS[o.status]}</span></p>` : ''}
      <section class="box">
        <div class="cust"><span class="avatar lg">${esc((o.name || '?').trim().charAt(0).toUpperCase())}</span><div><strong>${esc(o.name)}</strong><small>Langue : ${o.lang.toUpperCase()}</small></div></div>
        <dl class="kv">
          <dt>Téléphone</dt><dd><a href="tel:+${esc(o.phone)}">${esc(o.phone_display)}</a></dd>
          ${o.email ? `<dt>E-mail</dt><dd><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></dd>` : ''}
          <dt>Ville</dt><dd>${esc(o.city)}</dd>
          <dt>Adresse</dt><dd>${esc(o.address)}</dd>
          ${o.note ? `<dt>Remarque</dt><dd>« ${esc(o.note)} »</dd>` : ''}
        </dl>
        <div class="actions">
          <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}?text=${encodeURIComponent(confirmMessage(o))}">WhatsApp</a>
          <a class="btn ghost" href="tel:+${esc(o.phone)}">${icon('phone', 18)}<span>Appeler</span></a>
        </div>
      </section>
      <section class="box">
        <ul class="lines">${items.map((i) => `<li><span>${esc(i.name)}${i.option ? ` <small>(${esc(i.option)})</small>` : ''} <small>× ${i.qty}</small></span><b>${dh(i.price * i.qty)}</b></li>`).join('')}
          <li class="muted"><span>Livraison</span><span>${o.shipping ? dh(o.shipping) : 'Gratuite'}</span></li>
          <li class="total"><span>À encaisser</span><b>${dh(o.total)}</b></li></ul>
      </section>
      <label>Note interne<textarea name="admin_note" rows="2" placeholder="Visible uniquement par vous">${esc(o.admin_note)}</textarea></label>
      <div><p class="label">Changer le statut</p>
      <div class="filters">${Object.entries(STATUS).map(([k, v]) => `<button type="button" class="pill${o.status === k ? ' on' : ''}" data-set="${k}"><i class="dot s-${k}"></i>${v}</button>`).join('')}</div>
      ${emailNote ? `<p class="muted small">${icon('mail', 14)} Le client reçoit un e-mail quand la commande passe à Confirmée, Expédiée, Livrée ou Annulée.</p>` : ''}</div>`;
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (location.hash === `#order-${id}`) history.replaceState(null, '', '#orders');
    });
    dialog.addEventListener('click', async (e) => {
      if (e.target === dialog) dialog.close();
      const set = e.target.closest('[data-set]');
      if (!set || set.dataset.set === o.status) return;
      try {
        const r = await api(`/orders/${id}`, { method: 'PATCH', body: { status: set.dataset.set, admin_note: dialog.querySelector('[name=admin_note]').value } });
        toast(r.emailed ? 'Commande mise à jour · e-mail envoyé au client' : 'Commande mise à jour');
        dialog.close();
        orders();
      } catch (err) {
        toast(err.message, true);
      }
    });
    dialog.querySelector('[name=admin_note]').addEventListener('change', (e) => api(`/orders/${id}`, { method: 'PATCH', body: { admin_note: e.target.value } }).then(() => toast('Note enregistrée')));
    dialog.showModal();
  }

  // Products
  async function products() {
    loading(NAV.products);
    const { products: list } = await api('/products');
    const cat = (id) => state.categories.find((c) => c.id === id)?.name_fr || '—';
    shell(
      NAV.products,
      list.length
        ? `<div class="card flush"><table class="table"><thead><tr><th></th><th>Produit</th><th class="hide-sm">Catégorie</th><th>Prix</th><th>Stock</th><th class="hide-sm">État</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-product="${p.id}"><td class="tight"><img class="thumb" src="${esc(JSON.parse(p.images || '[]')[0] || '/assets/placeholder.svg')}" alt=""></td><td><strong>${esc(p.name_fr || p.name_ar || p.name_en)}</strong>${p.featured ? ' <span class="chip chip-gold">★ Accueil</span>' : ''}</td><td class="hide-sm">${esc(cat(p.category_id))}</td><td class="nowrap">${dh(p.price)}</td><td>${p.stock == null ? '<span class="muted">∞</span>' : p.stock <= 3 ? `<span class="chip ${p.stock ? 'chip-warn' : 'chip-bad'}">${p.stock}</span>` : p.stock}</td><td class="hide-sm">${p.active ? '<span class="chip chip-ok">En ligne</span>' : '<span class="chip">Masqué</span>'}</td></tr>`).join('')}
      </tbody></table></div>`
        : `<div class="card empty">${icon('products', 36)}<p>Aucun produit. Ajoutez le premier.</p></div>`,
      { sub: `${list.length} produit${list.length > 1 ? 's' : ''}`, actions: `<button class="btn" data-new>${icon('plus', 18)}<span>Ajouter</span></button>` },
    );
    app.querySelector('[data-new]').addEventListener('click', () => productForm({ active: 1, images: '[]' }));
    app.querySelectorAll('[data-product]').forEach((tr) => tr.addEventListener('click', () => productForm(list.find((p) => p.id === Number(tr.dataset.product)))));
  }

  function productForm(p) {
    const images = JSON.parse(p.images || '[]');
    const field = (name, label, attrs = '') => `<label>${label}<input name="${name}" value="${esc(p[name] ?? '')}" ${attrs}></label>`;
    const area = (name, label, attrs = '') => `<label>${label}<textarea name="${name}" rows="3" ${attrs}>${esc(p[name] ?? '')}</textarea></label>`;
    shell(
      p.id ? 'Modifier le produit' : 'Nouveau produit',
      `<form class="form" id="pform">
      <div class="card"><h2>Nom</h2><div class="cols3">
        ${field('name_fr', 'Français')}
        ${field('name_ar', 'العربية', 'dir="rtl" lang="ar"')}
        ${field('name_en', 'English')}
      </div></div>
      <div class="card"><h2>Prix et stock</h2><div class="cols">
        ${field('price', 'Prix (DH)', 'type="number" min="0" step="1" required inputmode="numeric"')}
        ${field('compare_price', 'Ancien prix (barré, facultatif)', 'type="number" min="0" step="1" inputmode="numeric"')}
        ${field('stock', 'Stock (vide = illimité)', 'type="number" min="0" step="1" inputmode="numeric"')}
        <label>Catégorie<select name="category_id"><option value="">—</option>${state.categories.map((c) => `<option value="${c.id}"${c.id === p.category_id ? ' selected' : ''}>${esc(c.name_fr)}</option>`).join('')}</select></label>
      </div>
      ${field('options', 'Options (tailles, couleurs…) séparées par des virgules', 'placeholder="S, M, L, XL"')}</div>
      <div class="card"><h2>Photos</h2>
        <div class="photos" id="photos"></div>
        ${state.images ? '<label class="btn ghost upload">Ajouter des photos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden></label>' : '<p class="muted small">Pour envoyer des photos depuis votre téléphone, activez le stockage R2 (voir README). En attendant, collez des liens d’images ci-dessous.</p>'}
        <label>Liens des photos (un par ligne)<textarea name="images" rows="2">${esc(images.join('\n'))}</textarea></label>
      </div>
      <div class="card"><h2>Description</h2>
        ${area('desc_fr', 'Français')}
        ${area('desc_ar', 'العربية', 'dir="rtl" lang="ar"')}
        ${area('desc_en', 'English')}
      </div>
      <div class="card"><h2>Affichage</h2><div class="cols">
        ${field('slug', 'Adresse de la page (slug)', 'placeholder="automatique"')}
        ${field('sort', 'Ordre d’affichage', 'type="number" step="1"')}
      </div>
      <label class="switch"><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}><span></span> Mettre en avant sur l’accueil</label>
      <label class="switch"><input type="checkbox" name="active"${p.active ? ' checked' : ''}><span></span> En ligne (visible dans la boutique)</label></div>
      <div class="sticky-actions"><button type="button" class="btn ghost" data-back>Annuler</button>${p.id ? `<a class="btn ghost hide-sm" href="/fr/p/${esc(p.slug)}" target="_blank" rel="noopener">Voir</a><button type="button" class="btn danger" data-delete>Supprimer</button>` : ''}<button class="btn">Enregistrer</button></div>
    </form>`,
    );
    const f = document.getElementById('pform');
    const drawPhotos = () => {
      const list = f.images.value.split('\n').map((s) => s.trim()).filter(Boolean);
      document.getElementById('photos').innerHTML = list.map((u, i) => `<figure><img src="${esc(u)}" alt=""><button type="button" class="link" data-rm="${i}">Retirer</button></figure>`).join('');
    };
    drawPhotos();
    f.images.addEventListener('input', drawPhotos);
    f.addEventListener('click', async (e) => {
      if (e.target.closest('[data-back]')) products();
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const list = f.images.value.split('\n').map((s) => s.trim()).filter(Boolean);
        list.splice(Number(rm.dataset.rm), 1);
        f.images.value = list.join('\n');
        drawPhotos();
      }
      if (e.target.closest('[data-delete]') && confirm('Supprimer ce produit ? Les anciennes commandes sont conservées.')) {
        await api(`/products/${p.id}`, { method: 'DELETE' });
        toast('Produit supprimé');
        products();
      }
    });
    f.querySelector('input[type=file]')?.addEventListener('change', async (e) => {
      for (const file of e.target.files) {
        try {
          toast(`Envoi de ${file.name}…`);
          const { url } = await api('/images', { method: 'POST', raw: file });
          f.images.value = [...f.images.value.split('\n').filter((s) => s.trim()), url].join('\n');
          drawPhotos();
        } catch (err) {
          toast(err.message, true);
        }
      }
      e.target.value = '';
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f));
      data.featured = f.featured.checked;
      data.active = f.active.checked;
      try {
        await api(p.id ? `/products/${p.id}` : '/products', { method: p.id ? 'PUT' : 'POST', body: data });
        toast('Produit enregistré');
        products();
      } catch (err) {
        toast(err.message, true);
      }
    });
  }

  // Categories
  async function categories() {
    state.categories = (await api('/categories')).categories;
    shell(
      NAV.categories,
      `<div class="card flush"><table class="table cats"><thead><tr><th>Photo</th><th>Français</th><th>العربية</th><th>English</th><th>Lien de la photo</th><th>Ordre</th><th>Produits</th><th></th></tr></thead><tbody>
      ${state.categories.map((c) => `<tr data-cat="${c.id}"><td><img class="thumb" src="${esc(c.image || '/assets/placeholder.svg')}" alt=""></td><td><input name="name_fr" value="${esc(c.name_fr)}"></td><td><input name="name_ar" dir="rtl" value="${esc(c.name_ar)}"></td><td><input name="name_en" value="${esc(c.name_en)}"></td><td><input name="image" value="${esc(c.image || '')}" placeholder="/img/… ou https://…"></td><td><input name="sort" type="number" value="${c.sort}" class="num"></td><td>${c.products}</td><td class="nowrap"><button class="btn small" data-save>OK</button> <button class="link" data-del>Supprimer</button></td></tr>`).join('')}
      <tr data-cat="" class="new-row"><td></td><td><input name="name_fr" placeholder="Nouvelle catégorie"></td><td><input name="name_ar" dir="rtl"></td><td><input name="name_en"></td><td><input name="image" placeholder="/img/… ou https://…"></td><td><input name="sort" type="number" value="0" class="num"></td><td></td><td><button class="btn small" data-save>Ajouter</button></td></tr>
      </tbody></table></div>`,
      { sub: 'Les rayons de votre boutique' },
    );
    app.querySelectorAll('[data-cat]').forEach((tr) => {
      const id = tr.dataset.cat;
      tr.querySelector('[data-save]').addEventListener('click', async () => {
        const data = Object.fromEntries([...tr.querySelectorAll('input')].map((i) => [i.name, i.value]));
        if (id) data.slug = state.categories.find((c) => c.id === Number(id)).slug;
        try {
          await api(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: data });
          toast('Catégorie enregistrée');
          categories();
        } catch (err) {
          toast(err.message, true);
        }
      });
      tr.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!confirm('Supprimer cette catégorie ? Ses produits restent en ligne, sans catégorie.')) return;
        await api(`/categories/${id}`, { method: 'DELETE' });
        categories();
      });
    });
  }

  // Settings
  function settings() {
    const s = state.settings;
    const field = (k, label, attrs = '') => `<label>${label}<input name="${k}" value="${esc(s[k] ?? '')}" ${attrs}></label>`;
    let rates = {};
    try {
      rates = JSON.parse(s.shipping_rates || '{}');
    } catch {}
    const steps = `<ol class="howto">
        <li>Créez un compte gratuit sur <a href="https://www.brevo.com" target="_blank" rel="noopener">brevo.com</a> (300 e-mails par jour offerts).</li>
        <li>Dans Brevo, ouvrez <em>Expéditeurs, domaines et IP dédiées</em> et ajoutez votre adresse d’envoi (par ex. votre Gmail). Cliquez sur le lien de vérification reçu.</li>
        <li>Dans Brevo, ouvrez <em>SMTP et API → Clés API</em> et créez une clé. Ne la partagez avec personne.</li>
        <li>Sur votre PC, dans le dossier de la boutique, lancez <code>npx wrangler secret put BREVO_API_KEY</code> et collez la clé quand on vous la demande.</li>
        <li>Indiquez ci-dessous l’adresse vérifiée, enregistrez, puis cliquez sur « Envoyer un test ».</li>
      </ol>`;
    shell(
      NAV.settings,
      `<form class="form" id="sform">
      <div class="card"><h2>Boutique</h2><div class="cols">
        ${field('store_name', 'Nom de la boutique', 'required')}
        ${field('whatsapp', 'Numéro WhatsApp (ex. 212612345678)', 'inputmode="tel"')}
        ${field('contact_email', 'E-mail de contact (les clients y répondent)', 'type="email"')}
      </div></div>
      <div class="card" id="emails"><div class="card-head"><h2>${icon('mail')} E-mails automatiques</h2><span class="chip ${state.emails ? 'chip-ok' : 'chip-warn'}">${state.emails ? 'Clé Brevo installée' : 'Clé Brevo manquante'}</span></div>
        <p class="muted small">À chaque commande, le client reçoit une confirmation dans sa langue (s’il a donné son e-mail) et vous recevez une alerte. Le client est aussi prévenu quand sa commande est confirmée, expédiée, livrée ou annulée.</p>
        ${state.emails ? '' : steps}
        <div class="cols">
          ${field('email_from', 'Adresse d’envoi (vérifiée dans Brevo)', 'type="email" placeholder="boutique@gmail.com"')}
          ${field('notify_email', 'Recevoir les alertes de commande sur', 'type="email" placeholder="vous@gmail.com"')}
        </div>
        <label class="switch"><input type="checkbox" name="email_status_updates"${s.email_status_updates !== '0' ? ' checked' : ''}><span></span> Prévenir le client à chaque changement de statut</label>
        <div class="actions"><button type="button" class="btn ghost" data-test>${icon('mail', 18)}<span>Envoyer un test</span></button></div>
        ${state.emails ? `<details><summary class="muted small">Comment ça marche ?</summary>${steps}</details>` : ''}
      </div>
      <div class="card"><h2>Livraison</h2>
        <div class="cols">
          ${field('shipping_fee', 'Frais de livraison par défaut (DH)', 'type="number" min="0"')}
          ${field('free_shipping_over', 'Livraison gratuite à partir de (DH, 0 = jamais)', 'type="number" min="0"')}
        </div>
        <label>Tarifs par ville (une ligne par ville : Ville = prix)<textarea name="rates" rows="4" placeholder="Casablanca = 20">${esc(Object.entries(rates).map(([c, v]) => `${c} = ${v}`).join('\n'))}</textarea></label>
      </div>
      <div class="card"><h2>Bandeau d’annonce</h2><p class="muted small">Le message qui défile en haut de chaque page.</p>
        ${field('announcement_fr', 'Français')}
        ${field('announcement_ar', 'العربية', 'dir="rtl"')}
        ${field('announcement_en', 'English')}
      </div>
      <div class="card"><h2>Accueil</h2><p class="muted small">Laissez vide pour garder le texte par défaut.</p><div class="cols">
        ${field('hero_title_fr', 'Titre · Français')}
        ${field('hero_text_fr', 'Sous-titre · Français')}
        ${field('hero_title_ar', 'العنوان · العربية', 'dir="rtl"')}
        ${field('hero_text_ar', 'النص · العربية', 'dir="rtl"')}
        ${field('hero_title_en', 'Title · English')}
        ${field('hero_text_en', 'Subtitle · English')}
      </div></div>
      <div class="sticky-actions"><button class="btn">Enregistrer les réglages</button></div>
    </form>`,
    );
    const f = document.getElementById('sform');
    const save = async () => {
      const data = Object.fromEntries(new FormData(f));
      const map = {};
      for (const line of data.rates.split('\n')) {
        const [city, price] = line.split('=').map((x) => x?.trim());
        if (city && price !== undefined && price !== '' && !Number.isNaN(Number(price))) map[city] = Number(price);
      }
      delete data.rates;
      data.shipping_rates = JSON.stringify(map);
      data.whatsapp = data.whatsapp.replace(/\D/g, '').replace(/^0(?=[5-7])/, '212');
      data.email_status_updates = f.email_status_updates.checked ? '1' : '0';
      await api('/settings', { method: 'PUT', body: data });
      state.settings = (await api('/settings')).settings;
    };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await save();
        toast('Réglages enregistrés');
        settings();
      } catch (err) {
        toast(err.message, true);
      }
    });
    f.querySelector('[data-test]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await save();
        const r = await api('/test-email', { method: 'POST', body: {} });
        toast(`E-mail de test envoyé à ${r.to}`);
      } catch (err) {
        toast(err.message, true);
      }
      btn.disabled = false;
    });
  }

  start();
})();
