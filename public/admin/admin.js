// Store admin (in French): orders, products, categories and settings. Talks to /api/admin/*.
(() => {
  const app = document.getElementById('app');
  const STATUS = { new: 'Nouvelle', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', returned: 'Retournée' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const dh = (n) => `${String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DH`;
  const when = (s) => new Date(`${s.replace(' ', 'T')}Z`).toLocaleString('fr-MA', { dateStyle: 'short', timeStyle: 'short' });
  let state = { tab: 'orders', status: '', q: '', images: false, settings: {}, categories: [] };

  let toastTimer;
  function toast(text, bad) {
    const el = document.querySelector('.toast');
    el.textContent = text;
    el.className = `toast${bad ? ' bad' : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2500);
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
      };
      throw new Error(messages[data.error] || data.error || `Erreur ${res.status}`);
    }
    return data;
  }

  // Login
  function login() {
    app.innerHTML = `<form class="login card" id="login">
      <h1>Administration</h1>
      <label>Mot de passe<input type="password" name="password" autocomplete="current-password" required autofocus></label>
      <button class="btn">Se connecter</button>
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

  function shell(content) {
    const tabs = { orders: 'Commandes', products: 'Produits', categories: 'Catégories', settings: 'Réglages' };
    app.innerHTML = `<header class="bar">
      <strong>${esc(state.settings.store_name || 'Boutique')}</strong>
      <nav>${Object.entries(tabs).map(([k, v]) => `<button class="tab${state.tab === k ? ' on' : ''}" data-tab="${k}">${v}</button>`).join('')}</nav>
      <span class="bar-end"><a href="/fr/" target="_blank" rel="noopener">Voir la boutique ↗</a><button class="link" data-logout>Déconnexion</button></span>
    </header><main class="main">${content}</main>`;
  }

  app.addEventListener('click', async (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.dataset.tab;
      render();
    }
    if (e.target.closest('[data-logout]')) {
      await api('/logout', { method: 'POST', body: {} });
      login();
    }
  });

  async function start() {
    try {
      const me = await api('/me');
      state.images = me.images;
      state.settings = (await api('/settings')).settings;
      state.categories = (await api('/categories')).categories;
      render();
    } catch (err) {
      if (err.message !== 'unauthorized') app.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  function render() {
    ({ orders, products, categories, settings })[state.tab]();
  }

  // Orders
  async function orders() {
    shell('<p class="loading">Chargement…</p>');
    const [stats, list] = await Promise.all([api('/stats'), api(`/orders?status=${state.status}&q=${encodeURIComponent(state.q)}`)]);
    const filters = [['', 'Toutes'], ...Object.entries(STATUS)];
    shell(`<section class="stats">
        <div><span>À confirmer</span><strong>${stats.new_orders || 0}</strong></div>
        <div><span>Aujourd’hui</span><strong>${stats.today || 0}</strong></div>
        <div><span>Commandes 30 j</span><strong>${stats.orders_30d || 0}</strong></div>
        <div><span>Encaissé 30 j (livrées)</span><strong>${dh(stats.revenue_30d)}</strong></div>
      </section>
      ${stats.low_stock?.length ? `<p class="warn">Stock bas : ${stats.low_stock.map((p) => `${esc(p.name_fr)} (${p.stock})`).join(', ')}</p>` : ''}
      <div class="toolbar">
        <div class="filters">${filters.map(([k, v]) => `<button class="pill${state.status === k ? ' on' : ''}" data-status="${k}">${v}</button>`).join('')}</div>
        <form class="search" id="osearch"><input type="search" name="q" value="${esc(state.q)}" placeholder="N°, nom, téléphone, ville"><button class="btn small">Chercher</button></form>
        <a class="btn small ghost" href="/api/admin/orders.csv?status=${state.status}">Exporter CSV</a>
      </div>
      ${list.orders.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Ville</th><th>Total</th><th>Statut</th></tr></thead><tbody>
        ${list.orders.map((o) => `<tr data-order="${o.id}"><td class="mono">${esc(o.number)}</td><td>${when(o.created_at)}</td><td>${esc(o.name)}<br><small>${esc(o.phone_display)}</small></td><td>${esc(o.city)}</td><td><strong>${dh(o.total)}</strong></td><td><span class="status s-${o.status}">${STATUS[o.status] || o.status}</span></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Aucune commande.</p>'}`);
    document.querySelectorAll('[data-status]').forEach((b) =>
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
    document.querySelectorAll('[data-order]').forEach((tr) => tr.addEventListener('click', () => orderDetail(tr.dataset.order)));
  }

  function confirmMessage(o) {
    const store = state.settings.store_name || '';
    const total = o.lang === 'ar' ? `${o.total} درهم` : o.lang === 'en' ? `MAD ${o.total}` : `${o.total} DH`;
    if (o.lang === 'ar') return `السلام عليكم ${o.name}، شكرًا على طلبك رقم ${o.number} (${total}) من ${store}. هل تؤكد التوصيل إلى ${o.city}؟`;
    if (o.lang === 'en') return `Hello ${o.name}, thank you for your order ${o.number} (${total}) from ${store}. Can you confirm delivery to ${o.city}?`;
    return `Bonjour ${o.name}, merci pour votre commande ${o.number} (${total}) chez ${store}. Pouvez-vous confirmer la livraison à ${o.city} ?`;
  }

  async function orderDetail(id) {
    const { order: o, items } = await api(`/orders/${id}`);
    const dialog = document.createElement('dialog');
    dialog.className = 'drawer';
    dialog.innerHTML = `<form method="dialog" class="drawer-head"><h2>Commande <span class="mono">${esc(o.number)}</span></h2><button class="link" aria-label="Fermer">✕</button></form>
      <p><span class="status s-${o.status}">${STATUS[o.status]}</span> · ${when(o.created_at)} · langue ${o.lang.toUpperCase()}</p>
      <dl class="kv">
        <dt>Client</dt><dd>${esc(o.name)}</dd>
        <dt>Téléphone</dt><dd><a href="tel:+${esc(o.phone)}">${esc(o.phone_display)}</a></dd>
        <dt>Ville</dt><dd>${esc(o.city)}</dd>
        <dt>Adresse</dt><dd>${esc(o.address)}</dd>
        ${o.note ? `<dt>Remarque</dt><dd>${esc(o.note)}</dd>` : ''}
      </dl>
      <div class="actions">
        <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}?text=${encodeURIComponent(confirmMessage(o))}">Confirmer sur WhatsApp</a>
        <a class="btn ghost" href="tel:+${esc(o.phone)}">Appeler</a>
      </div>
      <table class="table compact"><tbody>
        ${items.map((i) => `<tr><td>${esc(i.name)}${i.option ? ` <small>(${esc(i.option)})</small>` : ''}</td><td>× ${i.qty}</td><td>${dh(i.price * i.qty)}</td></tr>`).join('')}
        <tr><td colspan="2">Livraison</td><td>${dh(o.shipping)}</td></tr>
        <tr class="strong"><td colspan="2">Total à encaisser</td><td>${dh(o.total)}</td></tr>
      </tbody></table>
      <label>Note interne<textarea name="admin_note" rows="2">${esc(o.admin_note)}</textarea></label>
      <p><strong>Changer le statut</strong></p>
      <div class="filters">${Object.entries(STATUS).map(([k, v]) => `<button type="button" class="pill${o.status === k ? ' on' : ''}" data-set="${k}">${v}</button>`).join('')}</div>`;
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove());
    dialog.addEventListener('click', async (e) => {
      if (e.target === dialog) dialog.close();
      const set = e.target.closest('[data-set]');
      if (!set) return;
      try {
        await api(`/orders/${id}`, { method: 'PATCH', body: { status: set.dataset.set, admin_note: dialog.querySelector('[name=admin_note]').value } });
        toast('Commande mise à jour');
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
    shell('<p class="loading">Chargement…</p>');
    const { products: list } = await api('/products');
    const cat = (id) => state.categories.find((c) => c.id === id)?.name_fr || '—';
    shell(`<div class="toolbar"><h1>Produits</h1><button class="btn" data-new>+ Ajouter un produit</button></div>
      ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th></th><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>État</th></tr></thead><tbody>
      ${list.map((p) => `<tr data-product="${p.id}"><td><img class="thumb" src="${esc(JSON.parse(p.images || '[]')[0] || '/assets/placeholder.svg')}" alt=""></td><td>${esc(p.name_fr || p.name_ar || p.name_en)}${p.featured ? ' ★' : ''}</td><td>${esc(cat(p.category_id))}</td><td>${dh(p.price)}</td><td>${p.stock == null ? '∞' : p.stock}</td><td>${p.active ? 'En ligne' : '<span class="muted">Masqué</span>'}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Aucun produit. Ajoutez le premier.</p>'}`);
    app.querySelector('[data-new]').addEventListener('click', () => productForm({ active: 1, images: '[]' }));
    app.querySelectorAll('[data-product]').forEach((tr) => tr.addEventListener('click', () => productForm(list.find((p) => p.id === Number(tr.dataset.product)))));
  }

  function productForm(p) {
    const images = JSON.parse(p.images || '[]');
    const field = (name, label, attrs = '') => `<label>${label}<input name="${name}" value="${esc(p[name] ?? '')}" ${attrs}></label>`;
    const area = (name, label, attrs = '') => `<label>${label}<textarea name="${name}" rows="3" ${attrs}>${esc(p[name] ?? '')}</textarea></label>`;
    shell(`<form class="card form" id="pform">
      <div class="toolbar"><h1>${p.id ? 'Modifier le produit' : 'Nouveau produit'}</h1><button type="button" class="link" data-back>← Retour</button></div>
      <fieldset><legend>Nom</legend>
        ${field('name_fr', 'Français')}
        ${field('name_ar', 'العربية', 'dir="rtl" lang="ar"')}
        ${field('name_en', 'English')}
      </fieldset>
      <div class="cols">
        ${field('price', 'Prix (DH)', 'type="number" min="0" step="1" required inputmode="numeric"')}
        ${field('compare_price', 'Ancien prix (barré, facultatif)', 'type="number" min="0" step="1" inputmode="numeric"')}
        ${field('stock', 'Stock (vide = illimité)', 'type="number" min="0" step="1" inputmode="numeric"')}
        <label>Catégorie<select name="category_id"><option value="">—</option>${state.categories.map((c) => `<option value="${c.id}"${c.id === p.category_id ? ' selected' : ''}>${esc(c.name_fr)}</option>`).join('')}</select></label>
      </div>
      ${field('options', 'Options (tailles, couleurs…) séparées par des virgules', 'placeholder="S, M, L, XL"')}
      <fieldset><legend>Photos</legend>
        <div class="photos" id="photos"></div>
        ${state.images ? '<label class="btn ghost small upload">Ajouter des photos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden></label>' : '<p class="muted">Pour envoyer des photos, configurez R2 (voir README). Vous pouvez coller des liens d’images ci-dessous.</p>'}
        <label>Liens des photos (un par ligne)<textarea name="images" rows="2">${esc(images.join('\n'))}</textarea></label>
      </fieldset>
      <fieldset><legend>Description</legend>
        ${area('desc_fr', 'Français')}
        ${area('desc_ar', 'العربية', 'dir="rtl" lang="ar"')}
        ${area('desc_en', 'English')}
      </fieldset>
      <div class="cols">
        ${field('slug', 'Adresse de la page (slug)', 'placeholder="automatique"')}
        ${field('sort', 'Ordre d’affichage', 'type="number" step="1"')}
      </div>
      <label class="check"><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}> Mettre en avant sur l’accueil</label>
      <label class="check"><input type="checkbox" name="active"${p.active ? ' checked' : ''}> En ligne (visible dans la boutique)</label>
      <div class="actions"><button class="btn">Enregistrer</button>${p.id ? `<a class="btn ghost" href="/fr/p/${esc(p.slug)}" target="_blank" rel="noopener">Voir</a><button type="button" class="btn danger" data-delete>Supprimer</button>` : ''}</div>
    </form>`);
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
    shell(`<div class="toolbar"><h1>Catégories</h1></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Photo</th><th>Français</th><th>العربية</th><th>English</th><th>Lien de la photo</th><th>Ordre</th><th>Produits</th><th></th></tr></thead><tbody>
      ${state.categories.map((c) => `<tr data-cat="${c.id}"><td><img class="thumb" src="${esc(c.image || '/assets/placeholder.svg')}" alt=""></td><td><input name="name_fr" value="${esc(c.name_fr)}"></td><td><input name="name_ar" dir="rtl" value="${esc(c.name_ar)}"></td><td><input name="name_en" value="${esc(c.name_en)}"></td><td><input name="image" value="${esc(c.image || '')}" placeholder="/img/… ou https://…"></td><td><input name="sort" type="number" value="${c.sort}" class="num"></td><td>${c.products}</td><td class="nowrap"><button class="btn small" data-save>OK</button> <button class="link" data-del>Supprimer</button></td></tr>`).join('')}
      <tr data-cat=""><td></td><td><input name="name_fr" placeholder="Nouvelle catégorie"></td><td><input name="name_ar" dir="rtl"></td><td><input name="name_en"></td><td><input name="image" placeholder="/img/… ou https://…"></td><td><input name="sort" type="number" value="0" class="num"></td><td></td><td><button class="btn small" data-save>Ajouter</button></td></tr>
      </tbody></table></div>`);
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
    shell(`<form class="card form" id="sform">
      <h1>Réglages</h1>
      <div class="cols">
        ${field('store_name', 'Nom de la boutique', 'required')}
        ${field('whatsapp', 'Numéro WhatsApp (format international, ex. 212612345678)', 'inputmode="tel"')}
        ${field('contact_email', 'E-mail de contact', 'type="email"')}
      </div>
      <fieldset><legend>Livraison</legend>
        <div class="cols">
          ${field('shipping_fee', 'Frais de livraison par défaut (DH)', 'type="number" min="0"')}
          ${field('free_shipping_over', 'Livraison gratuite à partir de (DH, 0 = jamais)', 'type="number" min="0"')}
        </div>
        <label>Tarifs par ville (une ligne par ville : Ville = prix)<textarea name="rates" rows="4" placeholder="Casablanca = 20">${esc(Object.entries(rates).map(([c, v]) => `${c} = ${v}`).join('\n'))}</textarea></label>
      </fieldset>
      <fieldset><legend>Bandeau d’annonce (en haut de chaque page)</legend>
        ${field('announcement_fr', 'Français')}
        ${field('announcement_ar', 'العربية', 'dir="rtl"')}
        ${field('announcement_en', 'English')}
      </fieldset>
      <fieldset><legend>Accueil (laisser vide pour le texte par défaut)</legend>
        ${field('hero_title_fr', 'Titre — Français')}
        ${field('hero_text_fr', 'Sous-titre — Français')}
        ${field('hero_title_ar', 'العنوان — العربية', 'dir="rtl"')}
        ${field('hero_text_ar', 'النص — العربية', 'dir="rtl"')}
        ${field('hero_title_en', 'Title — English')}
        ${field('hero_text_en', 'Subtitle — English')}
      </fieldset>
      <div class="actions"><button class="btn">Enregistrer</button></div>
    </form>`);
    const f = document.getElementById('sform');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f));
      const map = {};
      for (const line of data.rates.split('\n')) {
        const [city, price] = line.split('=').map((x) => x?.trim());
        if (city && price !== undefined && price !== '' && !Number.isNaN(Number(price))) map[city] = Number(price);
      }
      delete data.rates;
      data.shipping_rates = JSON.stringify(map);
      data.whatsapp = data.whatsapp.replace(/\D/g, '').replace(/^0(?=[5-7])/, '212');
      try {
        await api('/settings', { method: 'PUT', body: data });
        state.settings = (await api('/settings')).settings;
        toast('Réglages enregistrés');
        settings();
      } catch (err) {
        toast(err.message, true);
      }
    });
  }

  start();
})();
