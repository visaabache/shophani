# Shophani: online store for Morocco (shophani.shop)

A fast, mobile-first online store for Moroccan customers:

- **Arabic (right to left), French and English**, with the URLs `/ar/`, `/fr/` and `/en/`. Visitors land in their browser's language, and the store remembers the one they pick.
- **Prices in Moroccan dirhams**: "199 DH" in French, "MAD 199" in English and "199 درهم" in Arabic.
- **Cash on delivery only.** Checkout asks for a name, a Moroccan phone number, the city and the address. There's no online payment and no customer account.
- **Shipping by city**: a default fee, per-city rates (for example Casablanca 20 DH) and free delivery above an amount you choose.
- **Catalogue**: categories, search, product photos (swipeable on mobile), options such as sizes, sale prices, stock with "only 3 left", and featured products.
- **Admin at `/admin/`** (in French): orders with status (new → confirmed → shipped → delivered / cancelled / returned), a one-tap WhatsApp confirmation message in the customer's language, call buttons, internal notes, CSV export for delivery companies, products, categories, photo upload and settings.
- **Design**: a full-screen photo slideshow, collections shown as Moroccan arches, story and banner sections, zellige patterns, product galleries with thumbnails, quick add to cart, a sticky "order now" bar and a bottom tab bar on phones, a free-delivery progress bar in the cart, and subtle scroll animations (turned off for visitors who ask their device for less motion). Typefaces: Fraunces and Manrope for French and English, Reem Kufi and IBM Plex Sans Arabic for Arabic.
- **Photos** from Unsplash, free for commercial use (see `CREDITS.md`, and the `/fr/credits` page).
- Built for search engines: pages are rendered on the server, with hreflang links between languages, product structured data (`Product` with the `MAD` price), a sitemap and robots.txt.

It runs on **Cloudflare Workers** with a **D1** database (orders, products) and **R2** storage (photos). The free plan is enough to start. It's plain JavaScript with no framework and no build step.

## Run it on your computer

```bash
npm install
cp .dev.vars.example .dev.vars        # sets the local admin password to "change-me"
npm run db:migrate:local              # creates the tables
npm run db:seed:local                 # optional: 11 sample products in 4 categories, with photos
npm run dev                           # http://localhost:8787
```

The admin is at http://localhost:8787/admin/.

To start over with a clean local database and the sample products, run `npm run db:reset:local`. This deletes every local order and product.

## Put it online (first time, free plan)

Everything below fits in Cloudflare's free plan: Workers (100,000 requests a day), D1 and static files. You don't need a domain to start. The store goes live at `https://shophani.<your-subdomain>.workers.dev`.

```bash
npx wrangler login                     # opens the browser: click Allow
npx wrangler d1 create shophani        # copy the database_id it prints over the zeros in wrangler.jsonc
npm run db:migrate                     # creates the tables online
npm run db:seed                        # optional: the sample products
npm run deploy                         # prints your workers.dev address
npx wrangler secret put ADMIN_PASSWORD # choose a long password for /admin/
```

In the admin, go to **Réglages** and set the store name, your WhatsApp number, the shipping prices and the announcement bar.

**Photo uploads (optional):** uploading photos from the admin uses R2. Cloudflare asks for a payment card before turning R2 on, even though the first 10 GB are free. Until then, paste image links in the product form. To turn it on, see the comment in `wrangler.jsonc`.

**Your own domain (later):** once shophani.shop is bought, add it to Cloudflare (point its nameservers to Cloudflare at the registrar), add the `routes` line shown in `wrangler.jsonc`, and run `npm run deploy` again.

When you change the database later, add a new file to `migrations/` (for example `0003_….sql`) and run `npm run db:migrate`.

### Optional: get notified of each new order

Set `ORDER_WEBHOOK` (`npx wrangler secret put ORDER_WEBHOOK`) to a URL that accepts a JSON POST, such as a Make/Zapier webhook or a Slack incoming webhook. Each order sends `{ text, number, total, city }`.

## How orders work

1. The cart lives in the visitor's browser. Prices, stock and shipping are always worked out again by the server (`/api/quote`), so a changed price in the browser has no effect.
2. Placing an order checks the stock and decrements it in one transaction. If two people buy the last item at the same moment, only one order goes through. The other customer sees their cart updated.
3. The customer gets an order number and a confirmation page. You see the order in the admin as **Nouvelle**. Tap **Confirmer sur WhatsApp** or **Appeler**, then mark it **Confirmée**, **Expédiée** and **Livrée**.
4. Marking an order **Annulée** or **Retournée** puts its items back in stock.
5. Protections: Moroccan phone numbers only (06, 07 and 05, in any common format), at most 5 orders per phone number per hour, and a hidden field that catches spam bots.

## Files

| Path | What it is |
| --- | --- |
| `src/worker.js` | Routing, storefront pages, order API, photos, sitemap |
| `src/render.js` | HTML of the storefront pages |
| `src/i18n.js` | All storefront text in Arabic, French and English |
| `src/admin.js` | Admin API (login, orders, products, categories, settings, uploads) |
| `src/lib.js` | Phone numbers, prices, shipping, cart pricing |
| `public/assets/` | `style.css`, `store.js` (cart and checkout), sample images |
| `public/admin/` | The admin app |
| `migrations/` | Database schema |
| `seed/sample.sql` | Sample products |
| `test/` | `npm test` |

To change the colours, edit `--primary` (Majorelle blue) and `--accent` (terracotta) at the top of `public/assets/style.css`. To change storefront wording, edit `src/i18n.js`.
