# OpticsScout: production cutover plan, Vercel → Cloudflare Worker (DRAFT)

Status: planning only. Nothing in this document has been executed. Every step that changes
DNS, Cloudflare, Vercel, Neon or a database needs the owner's explicit approval at the time.
Facts were gathered read-only on 2026-11-19 (public DNS, live HTTP responses, docs pages
cited inline, and the test Worker `opticsscout-cf-test`).

---

## 1. Preconditions and open decisions

### 1.1 Database driver on the production Worker (open)

| Option | What runs per DB request | Plan | Measured (test Worker, from Morocco) | Risks |
|---|---|---|---|---|
| A. `neon-http` + Prisma | Prisma query compiler (wasm) + Neon HTTP | Workers **Paid** ($5/month min) likely needed: owner-reported mixed-run median CPU 18.13 ms vs 10 ms Free limit | /search p50 ≈ 360 ms, click p50 ≈ 330–580 ms | Cost; one code path (same as Vercel) |
| B. `neon-sql` (raw SQL for /search + 2 click routes) | Neon HTTP only on those routes; Prisma for anything else | Possibly **Free** (CPU to be confirmed from the 10:31–10:36 UTC screenshots) | /search p50 ≈ 230 ms, click p50 ≈ 300–420 ms | Duplicated queries can drift from Prisma (see §7); needs an equivalence check before every deploy |
| C. `pg` + Prisma | TCP + TLS + SCRAM per request | Paid | slowest (≈1.5–1.8 s) | Highest CPU; not recommended by the data so far |

Prerendered pages (all 29 sitemap URLs) do not touch the database in any option; they are
served from the static-assets incremental cache (measured ≈110–150 ms p50, CPU P50 ≈ 4 ms).

### 1.2 Which database the Worker uses at cutover (open)

- **D1. Worker → the current production DB** (Vercel-managed Neon, `ep-calm-morning…`).
  Single source of truth during the hosting switch; no click split, no data refresh. The
  DB move to an owner-controlled Neon project happens later as a separate change.
  Risk: production DB stays inside the Vercel-managed integration a while longer; the
  Worker secret would hold a production credential.
- **D2. Worker → a fresh copy in the owner's Neon account** (§2). Hosting and DB move
  together. Risk: clicks split between two DBs while DNS propagates; needs a merge step.

### 1.3 Unordered queries (open, not fixed)

Several `findMany` calls without `orderBy` (e.g. `src/lib/seo/indexable-content.ts`, the
home page guide list, `searchContent`) return rows in physical order. After any
dump/restore the order can change: observed on the copy as two home-page guide links
swapped and a reordered sitemap (same entries). Options: (a) add explicit `orderBy` before
the switch (code change, affects Vercel output too; needs its own review), (b) accept the
reordering (content unchanged; only list order differs).

Decision (M8): explicit `orderBy` before the switch. Proposal from a read-only comparison of
the LIVE rendered order (2026-11-19) with candidate keys on the PRODUCTION database (not yet
implemented):

| List (file) | Live order reproduced by | Proposed `orderBy` | Rendering change on production |
|---|---|---|---|
| Sitemap guides (`indexable-content.ts` getIndexableGuidePaths) | `createdAt asc` only (no ties) | `[{ createdAt: "asc" }, { id: "asc" }]` | none |
| Sitemap comparisons (getIndexableComparisonPaths) | `createdAt asc`, `id asc` | `[{ createdAt: "asc" }, { id: "asc" }]` | none |
| Sitemap best pages (getIndexableBestPagePaths) | `createdAt asc` (and 4 others) | `[{ createdAt: "asc" }, { id: "asc" }]` | none |
| Home page guide list (`repository.ts` getIndexableGuideSummaries) | `createdAt asc` only | `[{ createdAt: "asc" }, { id: "asc" }]` | none |
| Search: guides / comparisons / best (`searchContent`) | `createdAt asc` | `[{ createdAt: "asc" }, { id: "asc" }]` (and the same `ORDER BY` in `neon-sql.ts`) | none |
| Category page comparisons / best pages (getCategoryBySlug) | any (≤ 1 item per category today) | `[{ createdAt: "asc" }, { id: "asc" }]` | none today |
| Sitemap products (getIndexableProductPaths) + search products | **no key** (physical row order = update history) | `[{ createdAt: "asc" }, { id: "asc" }]` or `slug asc` | **order changes** (same 8 URLs) |
| Sitemap categories (getIndexableCategoryPaths) | **no key** (order from the semi-join plan) | `{ name: "asc" }` (as every other category list) | **order changes** (same 3 URLs) |
| Product offers (nested `offers` includes) | n/a: no product has > 1 active offer | `{ createdAt: "asc" }` (as getOffers already uses) | none today |
| `generateStaticParams` slug lists, overlap-check lists | order not rendered | leave unordered | none |

The two "order changes" rows cannot be made identical with any existing column; a position
column would need a schema change (not proposed).

### 1.4 Other preconditions

- Next 16.4.6 + OpenNext branch (`cf-test`) reviewed and merged to `main` (today it exists
  only locally). Vercel must still build `main` (it did locally: Vercel-style build passes).
- A **separate production Worker** (e.g. `opticsscout`) rather than reusing
  `opticsscout-cf-test`, so the test Worker keeps its workers.dev-only noindex role.
- Deploy pipeline decided: GitHub → Vercel auto-deploy goes away for production. Options:
  manual `cf:build:clean` + `wrangler deploy` (documented in CLOUDFLARE_TEST_DEPLOY.md),
  Cloudflare Workers Builds, or GitHub Actions. Content changes (DB scripts) then need a
  rebuild + deploy through that pipeline, not a git push.
- `prisma migrate deploy` currently runs inside `vercel.json`'s buildCommand; on the
  Worker pipeline it must be a separate, deliberate step.
- Email: moving nameservers ends Namecheap free email forwarding (Namecheap KB: available
  only for domains on BasicDNS/PremiumDNS/FreeDNS). Decide: Cloudflare Email Routing
  (free) or accept no inbound mail. See §3.4.

---

## 2. Database refresh at cutover (only for option D2)

Same proven M2 procedure, against a NEW empty Neon project (or the copy emptied by
recreating the project; do not reuse a DB that has test rows).

1. Create Neon project (owner, console): Postgres **18**, AWS us-east-1.
2. Confirm empty: `public` has no tables (M2 step C query).
3. `pg_dump` 18: `-Fc --no-owner --no-acl --no-comments --exclude-schema=neon_auth` from
   production `DATABASE_URL_UNPOOLED` in a read-only session. Record UTC start time **T_dump**,
   size, sha256. Store outside the repo.
4. `pg_restore` 18 `--no-owner --no-acl --single-transaction --exit-on-error` into the new
   direct URL.
5. `scripts/db-content-hash.ts` on both; every table identical (ClickEvent compared for
   `createdAt < T_dump`).
6. `prisma migrate status` against the new DB: up to date (4 migrations).
7. Build the Worker against the new DB (`cf:build:clean`), set the Worker secret.

**When ClickEvent writes switch:** from the moment a visitor's resolver sees the new A
record (Worker custom domain, §3 Phase 2), their clicks go to the new DB; visitors still
resolving to Vercel keep writing to the production DB until their cached record expires.
With TTL lowered to 300 s and Cloudflare authoritative, that overlap is ≈5–30 min for most
resolvers (some ignore TTLs; tail up to hours).

**Click-loss window:**
- Rows written to production between **T_dump** and the end of the overlap are not in the
  new DB unless merged. Without a merge, loss = (T_dump → switch) + overlap.
- Merge option (a write to the new DB, needs approval): after ≥48 h, copy
  `ClickEvent` rows from production with `createdAt >= T_dump` into the new DB
  (`INSERT … ON CONFLICT (id) DO NOTHING`; ids are cuids, no collisions). Loss = 0.
- Option D1 avoids the window entirely.

---

## 3. DNS

### 3.1 Current records (public DNS, 2026-11-19)

| Name | Type | Value | TTL |
|---|---|---|---|
| opticsscout.com | A | 216.198.79.1 (Vercel) | 1799 |
| www | CNAME | 03f6f9616cc5fea7.vercel-dns-017.com | 1799 |
| opticsscout.com | MX 10 | eforward1.registrar-servers.com | 1800 |
| opticsscout.com | MX 10 | eforward2.registrar-servers.com | 1800 |
| opticsscout.com | MX 10 | eforward3.registrar-servers.com | 1800 |
| opticsscout.com | MX 15 | eforward4.registrar-servers.com | 1800 |
| opticsscout.com | MX 20 | eforward5.registrar-servers.com | 1800 |
| opticsscout.com | TXT | `google-site-verification=NoUOKV7yNafj4riGxZRtx9ieX5_sqGBWKcPAxMzTbjA` | 1799 |
| opticsscout.com | TXT | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | 1799 |
| opticsscout.com | NS | dns1.registrar-servers.com, dns2.registrar-servers.com | 1800 |

No AAAA, no CAA, no `_dmarc`, **no DS record (DNSSEC off)**.

### 3.2 Two-phase approach (recommended order; each phase separately approved)

Phase 1 moves only the DNS provider and keeps every record pointing where it points today,
so the site keeps being served by Vercel. Phase 2 points the hostname at the Worker. This
separates "nameserver change" risk from "hosting change" risk, and makes the hosting
rollback a minutes-long DNS edit instead of a nameserver revert.

**Phase 0 (T−3 days): lower TTLs at Namecheap**
1. Namecheap → Advanced DNS: set TTL of the A, CNAME and both TXT records to 5 min
   (300 s). Wait ≥ the old TTL (30 min) plus margin; a day is comfortable.

**Phase 1 (T−2 days): Cloudflare as DNS provider, still serving from Vercel**
1. Cloudflare dashboard → Add a domain `opticsscout.com`, Free plan. The zone stays
   **pending** until the nameservers change; while pending, the internet still asks
   Namecheap's nameservers, so nothing changes for visitors.
2. Review imported records; make the zone match §3.1 **exactly**:
   - A `opticsscout.com` → 216.198.79.1, **DNS only (grey cloud)**, TTL 300.
   - CNAME `www` → 03f6f9616cc5fea7.vercel-dns-017.com, **DNS only**, TTL 300.
   - TXT `opticsscout.com` → `google-site-verification=NoUOKV7yNafj4riGxZRtx9ieX5_sqGBWKcPAxMzTbjA`
     (copy-paste; compare character by character).
   - Email: either the five MX + SPF records as today (forwarding will stop anyway, see
     §3.4) or Cloudflare Email Routing records.
   - Delete any extra record the scan invented.
3. DNSSEC: currently off; keep it off at Namecheap and in Cloudflare during the move
   (Cloudflare: "Changing nameservers while DNSSEC is active can cause your domain to
   become unreachable"). Re-enabling is a later, separate decision.
4. Namecheap → Domain → Nameservers → Custom DNS → the two Cloudflare nameservers,
   copied exactly. Cloudflare says to allow up to 24 h.
5. Wait for the zone to become **Active**. Verify (§5.1 subset): site still served by
   Vercel (`server: Vercel`), GSC property still verified, TXT resolves identically.

**Phase 2 (switch day, low-traffic window §6): point opticsscout.com at the Worker**
Prerequisite: zone Active (Custom Domains require "an active Cloudflare zone",
docs 2026-11-12).
1. Delete the A record `opticsscout.com` (a Custom Domain cannot coexist with a CNAME on
   the hostname; deleting the A first is the safe path per the docs' migration steps).
2. Add the Worker Custom Domain `opticsscout.com` (wrangler.toml `[[routes]] pattern =
   "opticsscout.com", custom_domain = true`, then deploy; or dashboard). Cloudflare creates
   the DNS record and an edge certificate.
3. `www` → apex 308: see §4.1 options; delete the `www` CNAME to Vercel at this step.
4. Run the §5 checklist immediately.

Cutover time for visitors: Cloudflare is authoritative, so the change is visible as soon
as resolvers drop the old A record (TTL 300 s after Phase 0).

### 3.3 What stays on Vercel

The Vercel project and its `opticsscout.com` domain entry are left **untouched** for the
rollback period (≥ 2 weeks). Vercel will show the domain as misconfigured after Phase 2;
do not remove it (needed for rollback). Note: Vercel cannot renew its certificate for
opticsscout.com while DNS points elsewhere; a rollback long after the switch may first
need Vercel to re-issue a certificate (minutes, automatic once DNS points back).

### 3.4 Email

Namecheap free forwarding works only while Namecheap DNS is used, so Phase 1 ends it.
Options: Cloudflare Email Routing (free; MX/SPF/DKIM records added by Cloudflare; limits:
200 rules/domain, 200 destination addresses/account, 25 MiB per message), set up
immediately after the zone is Active; or no inbound mail. Test with an outside sender.

---

## 4. Behaviour parity: Vercel today vs the Worker

Measured read-only on 2026-11-19 (Vercel = opticsscout.com, Worker = test Worker).

| Behaviour | Vercel today | Worker today | Action / verification |
|---|---|---|---|
| `https://www.opticsscout.com/*` | **308** → `https://opticsscout.com/<path>?<query>` | n/a (no www yet) | §4.1 |
| `http://opticsscout.com/` | 308 → https | Cloudflare "Always Use HTTPS" (301 by default) or Worker | Decide; verify `curl -I http://opticsscout.com/` |
| `product-discovery-platform-theta.vercel.app/*` | **307** (not 308) → `https://opticsscout.com/<path>` | stays on Vercel | Unchanged; keeps working while the Vercel project exists |
| Trailing slash `/products/x/` | 308 → `/products/x` | 308 → `/products/x` | Same |
| Unknown slug / path | 404, Next 404 page, meta `noindex` | 404, same page, meta `noindex` | Same |
| `/favicon.ico` | 404 | 404 | Same (no favicon in either) |
| `/index.html` | 404 | 404 | Same |
| Uppercase path `/Products/vortex-ranger-1300` | **200** (canonical → lowercase) | **404** | Differs. Options: lowercase-redirect in `cloudflare/worker.js`, or accept (canonical already points lowercase on Vercel) |
| `Strict-Transport-Security` | `max-age=63072000` | **absent** | Differs. Cloudflare HSTS (Free; max-age up to 12 months) or set the header in the Worker wrapper. HSTS must not be removed later while active |
| `Cache-Control` (prerendered page) | `public, max-age=0, must-revalidate` | `s-maxage=31536000, stale-while-revalidate=2592000` | Differs; browsers ignore `s-maxage`, shared caches would keep pages ≤1 year. Consider normalising in the wrapper |
| `ETag` | present | absent | Minor (conditional requests) |
| `X-Robots-Tag` | absent | `noindex, nofollow` on workers.dev/localhost **only** (host check in `cloudflare/worker.js`) | Verify absent on opticsscout.com after switch |
| `robots.txt` | allow `/`, disallow `/admin`, `/api/`, sitemap line | override disallow-all on workers.dev only; on opticsscout.com the app's robots.ts output | Verify body identical to Vercel's after switch |
| `sitemap.xml` | 29 URLs, opticsscout.com | 29 URLs, same entries (order may differ, §1.3) | Compare sets |
| Canonicals | self, `https://opticsscout.com/...` | same (inlined at build) | cf:verify:pages |
| Old `/api/click/<p>/<m>` URLs | 302 to merchant (Amazon: tagged via runtime var) | same routes; `AMAZON_ASSOCIATE_TAG` runtime var present | Verify MidwayUSA 302 (one click row) |
| `/_next/image` | Vercel's optimizer | 404 (blocked in wrapper) | Intended (site doesn't use next/image) |
| `Access-Control-Allow-Origin: *` | present on pages | absent | Not used by the site; ignore unless a consumer needs it |

### 4.1 www → apex 308 options

- **W1. Second Worker Custom Domain `www.opticsscout.com`** + a host check in
  `cloudflare/worker.js` returning `308` to `https://opticsscout.com` + path + query.
  Exact parity with Vercel's 308; each www hit is a Worker invocation (counts toward
  requests, negligible CPU).
- **W2. Cloudflare Single Redirect rule** (Free: 10 rules/zone, docs 2026-08-14). Needs a
  proxied DNS record for `www`; preserves query string optionally. The docs page does not
  confirm that **308** is selectable (check the status-code dropdown); 301 is the
  documented example. 301 vs 308 is a minor SEO difference but not parity.

---

## 5. Verification right after the switch, and rollback

### 5.1 Checklist (read-only; scripts exist)

1. `dig +short opticsscout.com` resolves to Cloudflare; `server: cloudflare` on responses.
2. All **29 sitemap URLs** → 200 (1 req/s), each: canonical = self
   (`https://opticsscout.com/...`), meta robots `index, follow`, **no `X-Robots-Tag`
   header**.
3. `npm run cf:verify:pages -- "url:<Vercel deployment URL or saved baseline>"
   "url:https://opticsscout.com"`: literal Amazon hrefs
   (`https://www.amazon.com/dp/<ASIN>?tag=opticsscout06-20`, rel `sponsored nofollow
   noopener`, 18 across the site), title/meta/canonical/text/links; order-only diffs are
   §1.3. A baseline of the live Vercel HTML should be saved **before** Phase 2.
4. `robots.txt` body identical to Vercel's (allow + disallows + sitemap line);
   `sitemap.xml` 29 entries, all on opticsscout.com.
5. `https://www.opticsscout.com/guides/budget-vs-premium-rangefinder?x=1` →
   **308** → `https://opticsscout.com/guides/budget-vs-premium-rangefinder?x=1`.
6. `http://opticsscout.com/` → https redirect.
7. `GET /api/click/product_vortex_ranger_1300/merchant_midwayusa?page=%2Fcutover-check&placement=cutover-check`
   → 302 to `https://www.midwayusa.com/product/1019638617` (writes one row, label
   `cutover-check`).
8. `POST /api/click-event` (valid MidwayUSA body, placement `cutover-check`) → 204;
   confirm the row in the Worker's DB.
9. Unknown slug → 404 with meta noindex.
10. Google Search Console: domain property still verified (Settings → Ownership); URL
    Inspection → Live test on 2–3 URLs shows "URL is available to Google".
11. Cloudflare Worker Metrics: no errors / "Exceeded CPU" over the first hour.
12. Email test (if Email Routing chosen).

### 5.2 Rollback runbooks

| Situation | Steps | Time to take effect |
|---|---|---|
| **After Phase 2** (Worker serving, zone on Cloudflare) | 1. Remove the Worker Custom Domain(s). 2. Recreate A `opticsscout.com` → 216.198.79.1 and CNAME `www` → 03f6f9616cc5fea7.vercel-dns-017.com, both DNS only, TTL 300. 3. Check `server: Vercel`. | ≈5–10 min (TTL 300) + Vercel cert re-issue if expired |
| **Full revert** (back to Namecheap DNS) | 1. Namecheap → Nameservers → Namecheap BasicDNS. 2. Verify Namecheap still has the §3.1 host records (export/screenshot them **before** Phase 1; whether Namecheap keeps them while on Custom DNS is not verified). 3. Re-enable email forwarding. | Up to 24–48 h (registrar + resolver caches) |
| **DB problem only (D2)** | Point the Worker secret back to production (`wrangler secret put DATABASE_URL`) and redeploy, or roll back DNS (row above). Merge any rows written to the new DB back to production (approval). | Minutes |

The Vercel project, its env vars, its `opticsscout.com` domain entry and the production
DB stay untouched for ≥ 2 weeks after Phase 2.

---

## 6. SEO risk and timing

- **During the 30-day experiment:** a hosting switch changes response headers, latency
  and (with §1.3) list order. Content, URLs, canonicals and robots stay the same, so
  ranking risk is low if §5 passes, but any SEO change measured during the experiment
  would be confounded by the switch. Options: switch after the experiment ends (cleanest),
  or switch now and treat the switch date as an annotation/break in the experiment data.
- **Specific risks:** downtime/TLS errors during Phase 2 (mitigated by Phase 1 + TTL 300);
  missing/changed TXT → GSC unverified (copy exactly; check in §5.1); www redirect changing
  308 → 301 (W2); `X-Robots-Tag` leaking onto opticsscout.com (host check; verify);
  HSTS disappearing (re-add); uppercase-URL 200→404 (low; canonical already lowercase).
- **Low-traffic window (proxy data only):** real ClickEvent rows in production up to
  2026-11-18 (476 clicks, 409 sessions, 2026-09-18 → 2026-11-18). By UTC hour, fewest
  clicks at **04:00–09:00 UTC** (4–9 per hour vs 137 at 22:00 UTC) and 14:00 UTC; by
  weekday, Thursday–Sunday are lowest. Clicks are not pageviews and may include test/bot
  traffic; Vercel Analytics or GSC hourly data (not checked) would be better evidence.
  For a US audience, 04–09 UTC is late evening/night in US time zones.

---

## 7. Fix before the switch

1. **Read-only cache errors on unknown slugs / dynamic renders.** With the static-assets
   incremental cache, OpenNext logs "StaticAssetsIncrementalCache: Failed to set to
   read-only cache" whenever a non-prerendered page renders (unknown slug, /search).
   Harmless but noisy in logs; options: accept, filter in observability, or route those
   renders to a no-op cache.
2. **Driver default vs deploy-time override.** `wrangler.toml` says `pg`; the test Worker's
   current driver comes from `--var` at deploy. A plain deploy would revert. Put the chosen
   driver in `wrangler.toml` (production Worker) and stop using overrides.
3. **`AMAZON_ASSOCIATE_TAG`** runtime var present (public). eBay/Etsy/AWIN ids unset
   (no offers use them); add only if such offers are added.
4. **Secrets.** Production Worker: only `DATABASE_URL` (secret), set from a shell
   variable. Never reuse the test Worker's secret; keep the test Worker pointed at the
   copy.
5. **HSTS parity** (§4) and **cache-control** normalisation, uppercase-path behaviour.
6. **www handling** (§4.1) implemented and tested on workers.dev-style host first.
7. **Unordered queries** (§1.3) decision.
8. **neon-sql drift guard** (if option B): run the M7 equivalence check (23 search
   queries, redirect, ClickEvent columns) before every deploy; any change to search
   filters, active-offer rules or these tables must be made in both paths.
9. **Production Worker `workers_dev`.** Either disable it on the production Worker or keep
   the wrapper's noindex host check (it already applies to `*.workers.dev`).
10. **Deploy pipeline + migrations step** documented and dry-run (§1.4).
11. **Saved baselines** of the live Vercel HTML for the 29 sitemap URLs and headers,
    taken just before Phase 2, for the §5 comparison.
