// Prices shown in the visitor's currency. The store sells in Moroccan dirhams and the courier collects
// dirhams, so conversions are for display only: carts, orders, emails and the admin stay in MAD.
// The currency comes from the visitor's choice (cookie) or else from their country (Cloudflare's
// request.cf.country). Rates come from open.er-api.com (free, no key), refreshed every 12 hours.

import { money } from './lib.js';

export const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF', 'AED', 'SAR', 'QAR', 'KWD'];
const DECIMALS = { KWD: 3 };
const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK MC AD SM VA ME XK'.split(' ');
const BY_COUNTRY = { MA: 'MAD', US: 'USD', GB: 'GBP', CA: 'CAD', CH: 'CHF', LI: 'CHF', AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD' };
EURO.forEach((c) => (BY_COUNTRY[c] = 'EUR'));
// 1 MAD in each currency, used until live rates have been fetched once (or if the rates service is down).
const FALLBACK = { MAD: 1, EUR: 0.092, USD: 0.108, GBP: 0.079, CAD: 0.148, CHF: 0.086, AED: 0.397, SAR: 0.405, QAR: 0.393, KWD: 0.0332 };
const RATES_URL = 'https://open.er-api.com/v6/latest/MAD';
const MAX_AGE = 12 * 3600 * 1000;
const LOCALE = { ar: 'ar-MA', fr: 'fr-FR', en: 'en-US' };

export function currencyFor(request, settings) {
  if (settings.auto_currency === '0') return 'MAD';
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)cur=([A-Z]{3})/);
  if (cookie && CURRENCIES.includes(cookie[1])) return cookie[1];
  const country = request.cf?.country;
  if (!country || country === 'T1' || country === 'XX') return 'MAD';
  return BY_COUNTRY[country] || 'USD';
}

// Rates are kept in the settings table as {"ts": <ms>, "rates": {...}}. A stale or missing entry is
// refreshed in the background, so no page ever waits for the rates service.
export function ratesFrom(settings, env, exec) {
  let saved = null;
  try {
    saved = JSON.parse(settings.fx_rates || 'null');
  } catch {}
  const fresh = saved && saved.rates && Date.now() - saved.ts < MAX_AGE;
  if (!fresh && exec && env?.DB) exec.waitUntil(refreshRates(env.DB).catch(() => {}));
  return { ...FALLBACK, ...(saved?.rates || {}) };
}

async function refreshRates(db) {
  const res = await fetch(RATES_URL, { cf: { cacheTtl: 3600 } });
  if (!res.ok) return;
  const data = await res.json();
  if (data.result !== 'success' || !data.rates) return;
  const rates = Object.fromEntries(CURRENCIES.filter((c) => Number(data.rates[c]) > 0).map((c) => [c, Number(data.rates[c])]));
  await db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind('fx_rates', JSON.stringify({ ts: Date.now(), rates }))
    .run();
}

// Formats a MAD amount in the given currency ("45,90 €", "$49.90", "45,90 €" in Arabic pages too).
export function formatPrice(amountMad, lang, cur = 'MAD', rates = FALLBACK) {
  if (cur === 'MAD' || !rates[cur]) return money(amountMad, lang);
  const d = DECIMALS[cur] ?? 2;
  return new Intl.NumberFormat(LOCALE[lang] || 'fr-FR', { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d, numberingSystem: 'latn' }).format(
    (Number(amountMad) || 0) * rates[cur],
  );
}
