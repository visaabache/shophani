# Shop Hani (شوپ هاني): online store for Morocco (shophani.online)

A fast, mobile-first general store (electronics, fashion, beauty, home) for Moroccan customers:

- **Arabic (right to left), French and English**, with the URLs `/ar/`, `/fr/` and `/en/`. Visitors land in their browser's language, and the store remembers the one they pick.
- **Prices in Moroccan dirhams**: "199 DH" in French, "MAD 199" in English and "199 درهم" in Arabic.
- **Prices in the visitor's currency**: visitors abroad see prices in their own currency, chosen from their country (euro across the eurozone, dollar, pound, Canadian dollar, Swiss franc, dirham of the UAE, riyals of Saudi Arabia and Qatar, Kuwaiti dinar; dollar elsewhere). They can change it from the footer. Cart and checkout show the dirham amount the courier collects, and orders, emails and the admin stay in dirhams. Rates come from open.er-api.com, refreshed every 12 hours (`src/currency.js`). Turn it off in the admin under Réglages → Devise.
- **Catalogue**: categories, search, product photos (swipeable on mobile), options (colours shown as swatches, sizes or any other choice, each value can add or take off a price; the customer's choice shows in the order and emails), sale prices, stock with "only 3 left", and featured products.
- **Quantity offers** ("2 for 340 DH, 3 for 480 DH"), set per product in the admin: the product page shows them as cards to pick from (1 piece at the normal price, then each offer with the old price struck through and a red "save 60 DH" badge, one can be marked "most popular 🔥"). The server prices the offer, colour and size price changes are added per piece, and the order, admin and emails name the offer. Stored with the options, so no migration.
- **Cash on delivery only.** Visitors order straight from the product page (full name, city, address, phone) or through the cart for several products; checkout asks for the same four fields. There's no online payment and no customer account.
- **Free delivery everywhere**: delivery is included in the product prices, so the price shown is what the customer pays the courier.
- **Search engines (SEO)**, built to keep working whatever products the admin adds or removes: keyword titles and descriptions generated for every page (home, shop, categories, products, articles), a store text with the cities served and an FAQ on the home page, structured data for Google (online store, site search box, breadcrumbs, product offers with free shipping and 7-day returns, FAQ, articles), canonical and hreflang links on `shophani.online`, and a sitemap at `/sitemap.xml` with every current product (with photo), category and article. A deleted product's address redirects to its category, a renamed one to its new address, and a hidden one to its category until it comes back. Paste the Google Search Console code in the admin under Réglages → Google.
- **Blog** at `/blog`, written in the admin (Blog section) with the same editor as descriptions: title, short summary used by Google, cover photo and text in each language. Five starter articles (cash on delivery, free delivery by city, gift ideas, buying tips, trends) come with migration 0007. Each article ends with the shop's current categories and newest products.
- **Domain**: `SITE_URL` in `wrangler.jsonc` is the public address; `www.shophani.online` and the workers.dev address redirect to it.
- **Admin at `/admin/`** (in French): orders with status (new → confirmed → shipped → delivered / cancelled / returned), a one-tap WhatsApp confirmation message in the customer's language, call buttons, internal notes, CSV export for delivery companies, products, categories, photo upload and settings.
- **Design**: a full-screen photo slideshow, category cards, story and banner sections, a soft dot pattern, product galleries with thumbnails, quick add to cart, a sticky "order now" bar and a bottom tab bar on phones, a free-delivery progress bar in the cart, and subtle scroll animations (turned off for visitors who ask their device for less motion). Typefaces: Outfit and Manrope for French and English, Alexandria and IBM Plex Sans Arabic for Arabic.
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

**Photo uploads:** in the product form, pick photos from your phone, tablet or computer, take one with the camera, or drag them in. Each photo is shrunk in the browser (longest side 1600 px) and stored in D1, so no extra service or payment card is needed; D1's free 5 GB holds thousands of photos. If you turn on R2 later (see the comment in `wrangler.jsonc`), new uploads go there instead and the old ones keep working.

**Automatic deploys:** the Worker is connected to this repo through Cloudflare's Git builds (Worker → Settings → Builds). Every push to the `redesign` branch is deployed to shophani.online by itself. Database migrations are not run automatically: run `npm run db:migrate` yourself when a change adds one.

**Your own domain (later):** once shophani.online is bought, add it to Cloudflare (point its nameservers to Cloudflare at the registrar), add the `routes` line shown in `wrangler.jsonc`, and run `npm run deploy` again.

When you change the database later, add a new file to `migrations/` (for example `0003_….sql`) and run `npm run db:migrate`.

### Order emails (free, optional)

The store sends emails through [Brevo](https://www.brevo.com), whose free plan allows 300 emails a day. When an order comes in, the customer gets a confirmation in their language, if they entered an email at checkout. You get a new-order alert. Customers also get an email when you mark their order confirmed, shipped, delivered or cancelled.

1. Create a free Brevo account. Under **Senders, domains & dedicated IPs**, add the address you'll send from (a Gmail address works) and click the verification link.
2. Under **SMTP & API → API keys**, create a key, then run `npx wrangler secret put BREVO_API_KEY` and paste the key when asked.
3. In the admin, go to **Réglages → E-mails automatiques**. Enter the sender address and the address that should receive the alerts, then click **Envoyer un test**.

Once shophani.online is bought, verify the domain in Brevo and send from an address like `commandes@shophani.online`. That lands in inboxes more reliably than a Gmail sender.

### Optional: get notified of each new order

Set `ORDER_WEBHOOK` (`npx wrangler secret put ORDER_WEBHOOK`) to a URL that accepts a JSON POST, such as a Make/Zapier webhook or a Slack incoming webhook. Each order sends `{ text, number, total, city }`.

## Privacy policy and terms of sale

`/privacy` and `/terms` (in AR/FR/EN) are written for a Moroccan cash-on-delivery store: law 09-08 on personal data (CNDP) and law 31-08 on consumer protection (7-day withdrawal, delivery, refused parcels). They are drafts. Fill in **Settings → Informations légales** (company name, ICE, RC, address, CNDP number), then have the texts checked by an accountant or lawyer. A "draft" notice shows on the pages until the name, ICE and address are filled in.

Instagram, Facebook and TikTok links go in **Settings → Réseaux sociaux**, as a full link or just the handle.

## Facebook and TikTok pixels

Paste the pixel IDs in **Settings → Pixels publicitaires** (just the ID, not the code). Nothing loads until an ID is set. Visitors then see a cookie banner, and the pixels load only after they accept (law 09-08); a "Cookies" link in the footer lets them change their mind. The privacy policy mentions the pixels automatically.

Events sent, with amounts in MAD: PageView, ViewContent (product page), AddToCart, InitiateCheckout (checkout page), and Purchase on Meta / PlaceAnOrder on TikTok (order confirmation, once per order, with the order number as event ID so a server-side Conversions API can be added later without double counting).

## How orders work

1. The cart lives in the visitor's browser. Prices, stock and shipping are always worked out again by the server (`/api/quote`), so a changed price in the browser has no effect.
2. Placing an order checks the stock and decrements it in one transaction. If two people buy the last item at the same moment, only one order goes through. The other customer sees their cart updated.
3. The customer gets an order number and a confirmation page. You see the order in the admin as **Nouvelle**. Tap **Confirmer sur WhatsApp** or **Appeler**, then mark it **Confirmée**, **Expédiée** and **Livrée**.
4. Marking an order **Annulée** or **Retournée** puts its items back in stock.
5. Protections: Moroccan phone numbers only (06, 07 and 05, in any common format), at most 5 orders per phone number per hour, and a hidden field that catches spam bots.

## Security

- **Admin login:** signed, HttpOnly, SameSite=Strict session cookie (7 days). After 5 wrong passwords in 15 minutes, or 20 in a day, that visitor is locked out. Changing `ADMIN_PASSWORD` logs out every device. The admin warns you if the password is shorter than 12 characters.
- **Fake orders:** at most 3 orders per phone number per hour, and 6 per visitor per hour (15 a day), plus a hidden field that catches bots. Visitors are counted by a salted hash of their IP, never the IP itself.
- **Cross-site requests:** every write must come from the store's own pages (Origin check), and admin writes must be JSON.
- **Uploads:** only real JPEG, PNG, WebP, GIF and AVIF files are accepted (the first bytes are checked, not just the name).
- **Headers:** a strict Content-Security-Policy (no inline scripts), HSTS, no framing, nosniff, and a locked-down Permissions-Policy.
- **Database:** every query uses bound parameters. All shop text is escaped before it reaches a page.

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

To change the colours, edit `--brand` (blue) and `--accent` (orange) at the top of `public/assets/style.css`. To change storefront wording, edit `src/i18n.js`.
