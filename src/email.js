// Order emails, sent through Brevo's HTTP API (free plan: 300 emails a day).
// Nothing is sent unless the BREVO_API_KEY secret is set and a sender address is saved in admin.
//   • to the customer, in their language: order received, then confirmed / shipped / delivered / cancelled
//   • to the store owner, in French: a new-order alert

import { T } from './i18n.js';
import { esc, money, displayPhone } from './lib.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i;

export const validEmail = (s) => EMAIL_RE.test(String(s || '').trim());

// Statuses that send the customer an update.
export const STATUS_EMAILS = ['confirmed', 'shipped', 'delivered', 'cancelled'];

const S = {
  fr: {
    received: 'Commande reçue',
    receivedSubject: (n) => `Votre commande ${n} est bien reçue`,
    hello: (name) => `Bonjour ${name},`,
    receivedText: 'Merci pour votre commande ! Nous vous appelons très vite pour la confirmer, puis nous l’expédions. Vous payez en espèces à la livraison.',
    statusSubject: { confirmed: (n) => `Commande ${n} confirmée`, shipped: (n) => `Commande ${n} expédiée`, delivered: (n) => `Commande ${n} livrée`, cancelled: (n) => `Commande ${n} annulée` },
    statusText: {
      confirmed: 'Bonne nouvelle : votre commande est confirmée. Nous la préparons avec soin.',
      shipped: 'Votre commande est en route ! Le livreur vous appellera avant de passer. Préparez le montant en espèces.',
      delivered: 'Votre commande est livrée. Merci de votre confiance, et à très bientôt !',
      cancelled: 'Votre commande a été annulée. Si c’est une erreur, répondez simplement à cet e-mail.',
    },
    track: 'Suivre ma commande',
    deliverTo: 'Livraison à',
    items: 'Articles',
    help: 'Une question ? Répondez à cet e-mail',
    whatsapp: 'ou écrivez-nous sur WhatsApp',
  },
  en: {
    received: 'Order received',
    receivedSubject: (n) => `We’ve received your order ${n}`,
    hello: (name) => `Hello ${name},`,
    receivedText: 'Thank you for your order! We’ll call you shortly to confirm it, then ship it. You pay in cash on delivery.',
    statusSubject: { confirmed: (n) => `Order ${n} confirmed`, shipped: (n) => `Order ${n} shipped`, delivered: (n) => `Order ${n} delivered`, cancelled: (n) => `Order ${n} cancelled` },
    statusText: {
      confirmed: 'Good news: your order is confirmed. We’re preparing it with care.',
      shipped: 'Your order is on its way! The courier will call before arriving. Please have the amount ready in cash.',
      delivered: 'Your order has been delivered. Thank you for shopping with us!',
      cancelled: 'Your order has been cancelled. If this is a mistake, just reply to this email.',
    },
    track: 'Track my order',
    deliverTo: 'Delivery to',
    items: 'Items',
    help: 'Questions? Reply to this email',
    whatsapp: 'or message us on WhatsApp',
  },
  ar: {
    received: 'تم استلام طلبك',
    receivedSubject: (n) => `توصلنا بطلبك ${n}`,
    hello: (name) => `مرحبًا ${name}،`,
    receivedText: 'شكرًا على طلبك! سنتصل بك قريبًا لتأكيده ثم نرسله إليك. الدفع نقدًا عند الاستلام.',
    statusSubject: { confirmed: (n) => `تم تأكيد الطلب ${n}`, shipped: (n) => `تم شحن الطلب ${n}`, delivered: (n) => `تم توصيل الطلب ${n}`, cancelled: (n) => `تم إلغاء الطلب ${n}` },
    statusText: {
      confirmed: 'خبر سار: تم تأكيد طلبك ونحن نجهزه بعناية.',
      shipped: 'طلبك في الطريق! سيتصل بك عامل التوصيل قبل الوصول. المرجو تجهيز المبلغ نقدًا.',
      delivered: 'تم توصيل طلبك. شكرًا على ثقتك، وإلى اللقاء قريبًا!',
      cancelled: 'تم إلغاء طلبك. إذا كان ذلك خطأ، يكفي أن ترد على هذه الرسالة.',
    },
    track: 'تتبع طلبي',
    deliverTo: 'التوصيل إلى',
    items: 'المنتجات',
    help: 'عندك سؤال؟ رد على هذه الرسالة',
    whatsapp: 'أو راسلنا على واتساب',
  },
};

// Brand colours, matching the storefront.
const C = { ink: '#16142b', majorelle: '#2747c9', gold: '#e3a93a', sand: '#f6efe3', cream: '#fffaf2', muted: '#6b6478', line: '#ece3d3', mint: '#2f6f5a' };
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function emailConfig(env, settings) {
  const from = String(settings.email_from || '').trim();
  return {
    on: Boolean(env.BREVO_API_KEY && validEmail(from)),
    from,
    store: settings.store_name || 'Shophani',
    notify: String(settings.notify_email || settings.contact_email || '').trim(),
    replyTo: String(settings.contact_email || from).trim(),
  };
}

export async function sendEmail(env, cfg, { to, toName, subject, html, text, replyTo }) {
  const res = await fetch(env.BREVO_API_URL || BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: cfg.store, email: cfg.from },
      to: [{ email: to, ...(toName ? { name: toName } : {}) }],
      replyTo: validEmail(replyTo) ? { email: replyTo } : undefined,
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

function frame({ lang, origin, cfg, settings, preheader, body }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';
  const s = S[lang];
  const wa = String(settings.whatsapp || '').replace(/\D/g, '');
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(cfg.store)}</title></head>
<body style="margin:0;padding:0;background:${C.sand};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;" dir="${dir}">
<tr><td align="center" style="padding:0 0 18px;"><a href="${esc(origin)}/${lang}/"><img src="${esc(origin)}/assets/brand/email-logo.png" width="180" height="51" alt="${esc(cfg.store)}" style="display:block;border:0;"></a></td></tr>
<tr><td style="background:#ffffff;border-radius:18px;overflow:hidden;">
<div style="height:6px;background:${C.majorelle};background-image:linear-gradient(90deg,${C.majorelle},${C.gold});font-size:0;line-height:0">&nbsp;</div>
<div style="padding:28px 28px 26px;font-family:${FONT};color:${C.ink};font-size:15px;line-height:1.6;text-align:${align};">${body}</div>
</td></tr>
<tr><td align="center" style="padding:20px 10px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
${esc(s.help)}${wa ? ` ${esc(s.whatsapp)}: <a href="https://wa.me/${wa}" style="color:${C.majorelle};">+${wa}</a>` : ''}<br>
<a href="${esc(origin)}/${lang}/" style="color:${C.muted};">${esc(cfg.store)}</a> · ${esc(T[lang].payOnDelivery)}
</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(lang, order, items) {
  const t = T[lang];
  const end = lang === 'ar' ? 'left' : 'right';
  const row = (a, b, style = '') =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line};${style}">${a}</td><td style="padding:8px 0;border-bottom:1px solid ${C.line};text-align:${end};white-space:nowrap;${style}">${b}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:18px 0 6px;">
${items.map((i) => row(`${esc(i.name)}${i.option ? ` · ${esc(i.option)}` : ''} <span style="color:${C.muted}">× ${i.qty}</span>`, esc(money(i.price * i.qty, lang)))).join('')}
${row(esc(t.js.shipping), order.shipping ? esc(money(order.shipping, lang)) : `<span style="color:${C.mint};font-weight:700">${esc(t.js.free)}</span>`, `color:${C.muted};`)}
${row(`<strong>${esc(t.js.total)}</strong>`, `<strong style="font-size:17px">${esc(money(order.total, lang))}</strong>`, 'border-bottom:0;')}
</table>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;"><tr><td style="background:${C.ink};border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

function badge(text, bg, color) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${bg};color:${color};font-size:12px;font-weight:700;letter-spacing:.02em;">${esc(text)}</span>`;
}

const orderLink = (origin, order) => `${origin}/${order.lang}/order/${order.number}?t=${order.token}`;

// To the customer, right after checkout.
export function confirmationEmail({ order, items, origin, cfg, settings }) {
  const lang = S[order.lang] ? order.lang : 'fr';
  const s = S[lang];
  const t = T[lang];
  const body = `${badge(s.received, '#fff1d6', '#8a5300')}
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;margin:14px 0 6px;color:${C.ink};">${esc(t.thanks)}</h1>
<p style="margin:0 0 4px;">${esc(s.hello(order.name))}</p>
<p style="margin:0;color:${C.muted};">${esc(s.receivedText)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:${C.cream};border-radius:12px;font-size:14px;"><tr>
<td style="padding:12px 14px;"><span style="color:${C.muted};">${esc(t.orderNumber)}</span><br><strong dir="ltr">${esc(order.number)}</strong></td>
<td style="padding:12px 14px;"><span style="color:${C.muted};">${esc(s.deliverTo)}</span><br><strong>${esc(order.city)}</strong></td>
</tr></table>
${itemsTable(lang, order, items)}
${button(orderLink(origin, order), s.track)}`;
  return {
    subject: s.receivedSubject(order.number),
    html: frame({ lang, origin, cfg, settings, preheader: s.receivedText, body }),
    text: `${s.hello(order.name)}\n\n${s.receivedText}\n\n${t.orderNumber}: ${order.number}\n${items.map((i) => `- ${i.name}${i.option ? ` (${i.option})` : ''} x${i.qty}`).join('\n')}\n${t.js.total}: ${money(order.total, lang)}\n\n${s.track}: ${orderLink(origin, order)}`,
  };
}

// To the customer, when the store changes the order's status.
export function statusEmail({ order, items, origin, cfg, settings }) {
  const lang = S[order.lang] ? order.lang : 'fr';
  const s = S[lang];
  const t = T[lang];
  const st = order.status;
  const colors = { confirmed: ['#e3e9ff', '#1d3fbf'], shipped: ['#e7f0ff', '#2563eb'], delivered: ['#dcf3e3', '#1d6b3a'], cancelled: ['#fde4e1', '#a12a1b'] }[st];
  const body = `${badge(t.status[st], colors[0], colors[1])}
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;margin:14px 0 6px;color:${C.ink};">${esc(s.statusSubject[st](order.number))}</h1>
<p style="margin:0 0 4px;">${esc(s.hello(order.name))}</p>
<p style="margin:0;color:${C.muted};">${esc(s.statusText[st])}</p>
${st === 'cancelled' ? '' : itemsTable(lang, order, items)}
${button(orderLink(origin, order), s.track)}`;
  return {
    subject: s.statusSubject[st](order.number),
    html: frame({ lang, origin, cfg, settings, preheader: s.statusText[st], body }),
    text: `${s.hello(order.name)}\n\n${s.statusText[st]}\n\n${t.orderNumber}: ${order.number}\n${s.track}: ${orderLink(origin, order)}`,
  };
}

// To the store owner, in French, for every new order.
export function alertEmail({ order, items, origin, cfg, settings }) {
  const phone = displayPhone(order.phone);
  const body = `${badge('Nouvelle commande', '#fff1d6', '#8a5300')}
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;margin:14px 0 4px;">${esc(money(order.total, 'fr'))} · ${esc(order.city)}</h1>
<p style="margin:0;color:${C.muted};">Commande <strong dir="ltr" style="color:${C.ink}">${esc(order.number)}</strong> · langue ${esc(order.lang.toUpperCase())}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;background:${C.cream};border-radius:12px;font-size:14px;"><tr><td style="padding:12px 14px;line-height:1.7;">
<strong>${esc(order.name)}</strong><br>
<a href="tel:+${esc(order.phone)}" style="color:${C.majorelle};">${esc(phone)}</a>${order.email ? ` · ${esc(order.email)}` : ''}<br>
${esc(order.address)}, ${esc(order.city)}${order.note ? `<br><em>« ${esc(order.note)} »</em>` : ''}
</td></tr></table>
${itemsTable('fr', order, items)}
${button(`${origin}/admin/#order-${order.id}`, 'Ouvrir dans l’admin')}
<p style="margin:12px 0 0;"><a href="https://wa.me/${esc(order.phone)}" style="color:#1a9e4b;font-weight:700;">Confirmer sur WhatsApp →</a></p>`;
  return {
    subject: `🛍️ Nouvelle commande ${order.number} · ${money(order.total, 'fr')} · ${order.city}`,
    html: frame({ lang: 'fr', origin, cfg, settings, preheader: `${order.name}, ${order.city}, ${money(order.total, 'fr')}`, body }),
    text: `Nouvelle commande ${order.number}\n${order.name} · ${phone}\n${order.address}, ${order.city}\n${items.map((i) => `- ${i.name}${i.option ? ` (${i.option})` : ''} x${i.qty}`).join('\n')}\nTotal: ${money(order.total, 'fr')}\n\n${origin}/admin/`,
  };
}

// Sends the emails for a new order. Errors are logged, never shown to the customer.
export async function sendOrderEmails(env, settings, origin, order, items) {
  const cfg = emailConfig(env, settings);
  if (!cfg.on) return;
  const args = { order, items, origin, cfg, settings };
  const jobs = [];
  if (order.email) {
    const m = confirmationEmail(args);
    jobs.push(sendEmail(env, cfg, { to: order.email, toName: order.name, replyTo: cfg.replyTo, ...m }));
  }
  if (validEmail(cfg.notify)) {
    const m = alertEmail(args);
    jobs.push(sendEmail(env, cfg, { to: cfg.notify, ...m }));
  }
  for (const r of await Promise.allSettled(jobs)) if (r.status === 'rejected') console.error('order email failed', String(r.reason));
}

export async function sendStatusEmail(env, settings, origin, order, items) {
  const cfg = emailConfig(env, settings);
  if (!cfg.on || !order.email || !STATUS_EMAILS.includes(order.status) || settings.email_status_updates === '0') return;
  try {
    await sendEmail(env, cfg, { to: order.email, toName: order.name, replyTo: cfg.replyTo, ...statusEmail({ order, items, origin, cfg, settings }) });
  } catch (err) {
    console.error('status email failed', String(err));
  }
}
