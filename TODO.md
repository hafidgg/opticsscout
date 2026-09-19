# TODO.md

Status legend: `PASS` `FAIL` `BLOCKED` `NOT_IMPLEMENTED`. Updated as work progresses —
this file is the single source of truth for what's actually done vs. claimed.

## Phase 0 — Foundation

- [x] `PASS` — Repository inspection (none existed; greenfield confirmed)
- [x] `PASS` — PROJECT_PLAN.md
- [x] `PASS` — ARCHITECTURE.md
- [x] `PASS` — DATA_MODEL.md
- [x] `PASS` — SEO_STRATEGY.md
- [x] `PASS` — MONETIZATION.md
- [x] `PASS` — TODO.md (this file)
- [x] `PASS` — Next.js 16 + TypeScript + Tailwind v4 + ESLint scaffold (`create-next-app`)
- [x] `PASS` — Prisma 7.10.0 + @prisma/client 7.10.0 + Zod installed, pinned
      (see NOTES_DEPENDENCIES.md for the RC-version issue encountered and resolved)
- [x] `PASS` — `prisma/schema.prisma` written per DATA_MODEL.md
- [ ] `BLOCKED — EXTERNAL NETWORK ACCESS REQUIRED` — `prisma validate` / `generate` /
      `migrate dev`. This sandbox's egress allowlist does not include
      `binaries.prisma.sh`. Must be run in an environment with that access (your machine
      or CI) before the Prisma Client types actually exist and before any DB-backed code
      can run. See NOTES_DEPENDENCIES.md for full detail.

## Phase 1 — Core data + affiliate abstraction

- [x] `PASS` — `.env.example` documenting all required/optional env vars
- [x] `PASS` — `lib/db/provisional-types.ts` — hand-written types mirroring
      schema.prisma, to be deleted once real `@prisma/client` types exist (see file
      header for the swap-over instructions)
- [x] `PASS` — `lib/affiliate/adapters/types.ts` — `MerchantAdapter` interface
- [x] `PASS` — Amazon/eBay/Etsy/Awin adapter stubs, each `isConfigured()`-safe —
      verified: each falls back to plain destinationUrl when its env var is unset
- [x] `PASS` — `lib/affiliate/index.ts` — `getAffiliateUrl()`
- [x] `PASS` — `lib/mock-data/*` — labeled mock Products/Merchants/Offers for the
      home-office niche (3 products, 3 merchants, 5 offers; ratings/reviewCount left
      null, not fabricated)
- [ ] `NOT_IMPLEMENTED` — `prisma/seed.ts` using the mock data (blocked on Prisma
      Client existing — see Phase 0 blocker)
- [x] `PASS` — `app/api/click/[productId]/[merchantId]/route.ts` — provisional
      in-memory click log + real 302 redirect logic; swap the in-memory array for
      Prisma `ClickEvent` writes once client exists (documented in file header)
- [x] `PASS` — `AffiliateButton`, `AffiliateDisclosure` components
- [x] `PASS` — Homepage rewritten (real content, no Google Fonts dependency — see
      below), replacing create-next-app's default template

### Evidence for Phase 1 "PASS" items (2026-09-04)

```
$ npx tsc --noEmit         → exit 0, no errors
$ npx eslint src           → exit 0, no errors
$ npx next build           → Compiled successfully; routes generated:
                              ○ /  (static)
                              ○ /_not-found (static)
                              ƒ /api/click/[productId]/[merchantId] (dynamic)
```

### Additional fix made during this phase

- `create-next-app`'s default `layout.tsx` used `next/font/google` (Geist/Geist Mono),
  which failed the production build in this sandbox with `403` fetching
  `fonts.googleapis.com` (another blocked-egress-domain issue, same class as the Prisma
  binaries block — not a code defect). Replaced with system font stack
  (`font-sans` via Tailwind) rather than `next/font/local`, since no local font files
  were supplied and self-hosting arbitrary fonts wasn't requested. This also removes an
  external network dependency from the render path (aligned with Section 21 performance
  goals). If a specific brand typeface is wanted later, swap in `next/font/local` with
  real font files.

## Phase 2 — SEO foundation + Quality Gate

- [x] `PASS` — `lib/seo/metadata.ts` — `buildMetadata()` + `robotsDirectiveFor()`;
      the single safety rule (only `seoStatus === "INDEXABLE"` emits `index, follow`)
      lives in one place
- [x] `PASS` — `lib/seo/structured-data.ts` (Product/Offer/BreadcrumbList/Article/FAQ
      JSON-LD builders) — never emits `aggregateRating` unless both `rating` and
      `reviewCount` are real non-null values (tested explicitly)
- [x] `PASS` — `lib/seo/quality-gate.ts` — pure, explainable 8-check gate + `nextSeoStatus()`
      state machine (DRAFT→REVIEW→READY; READY→INDEXABLE requires an explicit,
      non-automatic promotion step, not a gate pass)
- [x] `PASS` — `lib/seo/duplicate-detection.ts` — Jaccard-similarity overlap check,
      scoped to same-category comparisons, feeding the gate's `hasNoDuplicateIntent` check
- [x] `PASS` — `app/sitemap.ts`, `app/robots.ts` (Next.js native conventions)
- [x] `PASS` — `lib/seo/indexable-content.ts` — the only place sitemap data is read
      from; enforces `seoStatus === "INDEXABLE"`-only filtering
- [x] `PASS` — `components/seo/JsonLd.tsx`, `components/seo/Breadcrumbs.tsx` — visible
      breadcrumbs and their JSON-LD are built from the same `segments` input, so they
      cannot drift apart
- [x] `PASS` — `lib/linking/internal-links.ts` — internal linking foundation
      (Product→Category, Product→Alternatives), using only real modeled relationships,
      never inferred similarity
- [x] `PASS` — 31 unit tests across 3 test files (quality gate, duplicate detection,
      structured data) — see Evidence below

### Evidence for Phase 2 (2026-09-04)

```
$ npx tsc --noEmit         → exit 0, no errors
$ npx eslint src           → exit 0, no errors, no warnings
$ npx vitest run           → 3 test files, 31 tests, all passed
$ npx next build           → Compiled successfully; routes generated:
                              ○ /               (static)
                              ○ /_not-found     (static)
                              ƒ /api/click/[productId]/[merchantId] (dynamic)
                              ○ /robots.txt     (static)
                              ○ /sitemap.xml    (static)
```

Live server verification (`next start`, curled directly — not just "should work"):

```
$ curl http://localhost:3099/robots.txt
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Sitemap: http://localhost:3000/sitemap.xml

$ curl http://localhost:3099/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>http://localhost:3000</loc>
<lastmod>2026-09-04T23:19:39.726Z</lastmod>
<changefreq>weekly</changefreq>
<priority>1</priority>
</url>
</urlset>
```

**Critical confirmed behavior: the sitemap contains ONLY the homepage.** None of the 3
mock products appear, because all mock data is seeded at `seoStatus: "DRAFT"` and
`getIndexableProductPaths()` filters strictly on `"INDEXABLE"`. This is the explicit,
verified proof that mock-data pages are not being auto-indexed, per this phase's
instructions.

(The sitemap's `Sitemap:` line and `<loc>` show `localhost:3000` rather than `:3099`
because `NEXT_PUBLIC_SITE_URL` is unset in this test run and the code's documented
fallback is `http://localhost:3000` — not a bug, just an unset env var in this ad hoc
verification. Setting `NEXT_PUBLIC_SITE_URL` in `.env` fixes this for real deployments.)

### Notes / decisions made during this phase

- **Gate never auto-promotes to INDEXABLE.** Even a page that passes every check stays
  at `READY` until an explicit separate action promotes it — this matches Section 14's
  "Human Review" step in the automation pipeline and prevents the gate itself from
  becoming a silent bulk-publish mechanism.
- **`INTENT_OVERLAP_THRESHOLD = 0.6`** (duplicate-detection.ts) is documented as an
  experimental default, tunable via config, not a permanent rule — consistent with how
  ToolVerse's own thresholds are treated per its memory file.
- **Guide/Comparison indexable-content and internal-linking resolvers are deliberately
  not stubbed yet** — there's no real (non-mock) Guide/Comparison data to verify them
  against, and an unverifiable stub would be dead code. Added once those content types
  have real records (Phase 3+).
- Fixed a latent bug surfaced while re-verifying from a clean `.next`: `layout.tsx` used
  the ambient `LayoutProps<"/">` type, which only exists after Next.js generates
  `.next/types` — a fresh `tsc --noEmit` before any build failed. Replaced with a
  standard `{ children: React.ReactNode }` prop type so type-checking is reliable
  independent of build order.
- **Niche status: still the working MVP niche, not permanently validated.** Home
  Office & Ergonomic Workspace Gear remains a documented working assumption (see
  PROJECT_PLAN.md §3) pending real SEO/market/affiliate validation — nothing in Phase 2
  hard-codes it in a way that would be costly to change.

## Phase 3 — Core UI + routes

- [x] `PASS` — `lib/content/repository.ts` — single fetch point for all content;
      also the only place the Quality Gate is invoked, making "every route respects
      the gate" true structurally, not by convention
- [x] `PASS` — Mock data expanded: `categories.ts`, `comparisons.ts`, `guides.ts`,
      `best-pages.ts` (small representative set — 2 categories, 1 comparison, 1 guide,
      1 best-page, 3 products — not hundreds/thousands, per instructions)
- [x] `PASS` — Exactly one record (`product_standing_desk_alpha`) deliberately
      promoted to `seoStatus: "INDEXABLE"` as the end-to-end proof case; every other
      mock record deliberately left at DRAFT/REVIEW/READY as control cases proving the
      gate/filter still excludes them correctly as the dataset grows
- [x] `PASS` — `/products/[slug]`
- [x] `PASS` — `/compare/[slug]`
- [x] `PASS` — `/best/[slug]`
- [x] `PASS` — `/alternatives/[slug]` (keyed by source product slug; alternatives
      resolved only via the real `Product.alternatives` self-relation, never inferred)
- [x] `PASS` — `/guides/[slug]`
- [x] `PASS` — `/categories`, `/categories/[category]`
- [x] `PASS` — `/search` (always noindex; filters to INDEXABLE content only)
- [x] `PASS` — `ProductCard`, `ComparisonTable`, `WhereToBuy` (merchant offers +
      affiliate CTA integration), `Breadcrumbs` (shared UI/JSON-LD source) components
- [x] `PASS` — Design tokens rewritten in `globals.css` (pine/paper/terracotta
      palette, serif+sans pairing) — see Design Plan note below
- [x] `PASS` — Homepage rewritten again with real category/guide links and new tokens
- [x] `PASS` — `app/sitemap.ts` updated to pull from all 5 indexable-content resolvers
      (products, comparisons, guides, best-pages, categories)
- [ ] `NOT_IMPLEMENTED` — `/gifts/[slug]` — no mock gift-audience data was created this
      phase; same repository pattern would apply, deferred since it wasn't in this
      phase's explicit route list
- [ ] `NOT_IMPLEMENTED` — Trust pages: `/about`, `/how-we-test`, `/editorial-policy`,
      `/affiliate-disclosure`, `/privacy`, `/terms`, `/contact` — not in this phase's
      explicit scope; `AffiliateDisclosure` component is already placed on every
      content page, but the standalone policy pages themselves aren't built yet
- [ ] `NOT_IMPLEMENTED` — AdSense placeholder slots — not in this phase's explicit
      route/component list
- [ ] `NOT_IMPLEMENTED` — Minimal protected `/admin` scaffold — not in this phase's
      explicit scope; also still correctly deferred per Section 28

### Evidence for Phase 3 (2026-09-05)

```
$ npx tsc --noEmit         → exit 0, no errors
$ npx eslint src           → exit 0, no errors (fixed 2 real react/no-unescaped-entities)
$ npx vitest run           → 4 test files, 43 tests, all passed
$ npx next build           → Compiled successfully; routes generated:
                              ○ /                    (static)
                              ○ /categories          (static)
                              ● /categories/desks, /categories/chairs        (SSG)
                              ● /products/alpha-...  (SSG)
                              ● /products/beta-...   (SSG — resolves to 404, see below)
                              ● /products/gamma-...  (SSG — resolves to 404, see below)
                              ● /compare/alpha-vs-beta (SSG — resolves to 404)
                              ● /best/standing-desks-under-500 (SSG — resolves to 404)
                              ● /guides/best-standing-desks... (SSG — resolves to 404)
                              ● /alternatives/alpha-... (SSG)
                              ƒ /api/click/[productId]/[merchantId] (dynamic)
                              ƒ /search              (dynamic)
                              ○ /robots.txt, /sitemap.xml (static)
```

Live server verification (`next start`, curled directly, one restart per check due to
this sandbox's process lifecycle — see note below):

```
GET /                                                          → 200
GET /products/alpha-electric-standing-desk-48in  (INDEXABLE)   → 200
GET /products/beta-prolift-standing-desk-55in    (DRAFT)       → 404
GET /products/gamma-mesh-ergonomic-chair         (DRAFT)       → 404
GET /compare/alpha-...-vs-beta-...               (REVIEW)      → 404
GET /guides/best-standing-desks-for-home-offices (READY)       → 404
GET /best/standing-desks-under-500               (DRAFT)       → 404
GET /alternatives/alpha-electric-standing-desk-48in            → 200
GET /products/does-not-exist                     (unknown)     → 404
GET /categories                                                → 200
GET /categories/desks                                          → 200
GET /search?q=desk                                             → 200
```

**Confirms the strict DRAFT/REVIEW/READY/INDEXABLE semantics hold in practice, not
just in the gate function's unit tests**: a `READY` guide — which has fully passed
the Quality Gate — still correctly 404s, because promotion to `INDEXABLE` is a
separate explicit step the gate never performs automatically. The 404 page for
`beta` was inspected directly and contains no leaked `<h1>`/product content — it's a
genuine not-found response, not the product page with a 404 status code slapped on.

Sitemap, curled live:
```
$ curl http://localhost:3098/sitemap.xml
<url><loc>http://localhost:3000</loc> ... </url>
<url><loc>http://localhost:3000/categories</loc> ... </url>
<url><loc>http://localhost:3000/categories/desks</loc> ... </url>
<url><loc>http://localhost:3000/products/alpha-electric-standing-desk-48in</loc> ... </url>
```
Four entries, exactly matching what should be indexable: homepage, the static
categories index, the "desks" category (has an indexable product), and the one
promoted product. `/categories/chairs` correctly absent (its one product is DRAFT).
No comparison/guide/best-page entry — all still below the promotion threshold.

Structured data, curled live from the indexable product page — confirmed a real
`Product` JSON-LD node with two real `Offer`s (Amazon $399, eBay $379), correctly
**no** `aggregateRating` block (rating/reviewCount are null — never fabricated), and a
`BreadcrumbList` whose 3 items match the actual Home → Standing Desks → product path.

`<meta name="robots">` confirmed live: `index, follow` on the INDEXABLE product,
`noindex` on the DRAFT product's (404) metadata response — the single
`robotsDirectiveFor()` rule holds in the actual rendered HTML, not just in the
function's unit tests.

Affiliate click tracking confirmed live end-to-end:
```
$ curl -D - "http://localhost:3098/api/click/product_standing_desk_alpha/merchant_amazon?page=...&placement=where-to-buy"
HTTP/1.1 302 Found
location: https://www.amazon.com/example-alpha-standing-desk
set-cookie: anon_session_id=<uuid>; Path=/; HttpOnly; SameSite=lax; Max-Age=2592000
```
Real 302 to the real mock destination URL, anonymous session cookie set correctly
(no PII, HttpOnly, 30-day expiry matching the documented design).

robots.txt confirmed unchanged/correct: disallows `/admin`, `/admin/`, `/api/`.

### Sandbox process-lifecycle note (not a code issue)

Backgrounded `next start` processes in this tool environment do not reliably survive
across separate bash_tool calls — a server started in one call is sometimes
unreachable by the very next call even with `nohup`/nested subshells, and issuing
more than one `curl` per call intermittently exceeds the tool's execution time limit.
Worked around by restarting the server fresh (`nohup ... & sleep 8`) immediately
before each individual verification `curl`, one check per tool call. This added
overhead to verification but does not affect the correctness of what was verified —
every result above came from an actual live HTTP response, not an assumption.

### Notes / decisions made during this phase

- **Non-indexable content 404s rather than rendering noindex-but-visible.** There is
  no admin/preview auth system yet (still correctly deferred per Section 28), so the
  safest correct behavior for DRAFT/REVIEW/READY content on the *public* route is to
  return 404, not a visible preview. This is stricter than the theoretical minimum
  (noindex would technically satisfy "don't index it") but avoids ever exposing
  unfinished editorial content or unreviewed affiliate links publicly.
- **Category pages don't carry their own `seoStatus`.** They're structural hubs; a
  category is indexable exactly when it has ≥1 INDEXABLE product, avoiding an empty
  hub ever appearing in the sitemap (verified: `/categories/chairs` correctly absent).
- **`/gifts/[slug]`, trust pages, AdSense slots, and `/admin` were not built** — they
  were not in this phase's explicit numbered scope (1–15 as given), and building them
  without real content/requirements would mean unverifiable placeholder pages. Flagged
  here explicitly rather than silently skipped.
- **Niche status unchanged**: Home Office & Ergonomic Workspace Gear remains a
  working MVP assumption, not permanently validated (PROJECT_PLAN.md §3). Nothing
  built this phase hardcodes the niche in a way that would block supporting a
  different product category later — `Category`/`Product` are generic, and the
  repository/gate/route pattern is category-agnostic by construction.

### Design plan (frontend-design skill process, applied before coding)

- **Palette:** `#1c2b24` (deep pine, headings/primary text), `#f7f5f0` (warm paper
  background), `#b4622e` (burnt terracotta, CTAs/prices), `#2f6b4f` (moss green,
  "best price"/good-fit signals), `#6b6459` (warm grey, secondary text). Deliberately
  avoids the flagged cream+terracotta-as-decoration and near-black+neon defaults.
- **Type:** serif for headings (editorial, trustworthy feel — a buying guide, not a
  SaaS dashboard), system sans for UI/body/dense spec data. No tracked-out caps
  eyebrows, no middle-dot meta strings.
- **Layout:** left-aligned, information-dense (spec rows, comparison table) rather
  than centered marketing blocks; product cards are compact and data-forward, not
  oversized SaaS cards with heavy shadows.
- Explicitly deferred: no dark hero/gradient treatment from the shared "Re•Compare"
  reference screenshot was copied wholesale (Section 22 requires an original visual
  identity, not a generic template look) — the reference informed information density
  and card/table patterns, not the literal visual skin.

## Phase 4 — Testing & validation

- [ ] `NOT_IMPLEMENTED` — Additional route/component tests beyond the gate/repository
      integration tests already written (broader coverage — e.g. metadata builder
      edge cases, affiliate adapter unit tests — still pending)
- [x] `PASS` (partial) — `tsc --noEmit`, `eslint`, `next build`, `vitest run` all run
      and passing as of Phase 3 — see Evidence above; not yet formally re-run as a
      dedicated Phase 4 closing pass
- [x] `PASS` (living document) — SEO_AUDIT.md exists and is updated incrementally
      (updated again at the end of this phase)
- [ ] `NOT_IMPLEMENTED` — MONETIZATION_AUDIT.md
- [ ] `NOT_IMPLEMENTED` — FINAL_STATUS.md

## Phase 5 — Prisma unblocked; multi-sub-niche expansion (2026-09-07)

- [x] `PASS` — Prisma fully unblocked in this environment (see NOTES_DEPENDENCIES.md
      "Prisma unblocked" section — different environment, no network restriction;
      the real blocker was a Prisma 7 breaking schema change, resolved).
- [x] `PASS` — mock-data → real-Prisma-queries swap-over: `repository.ts`, the click
      route, `indexable-content.ts`, `sitemap.ts`, and all 7 page routes now query
      Postgres directly. `provisional-types.ts` deleted per its own header
      instruction. `prisma/seed.ts` seeds the original Home Office mock dataset
      (idempotent). All 43 tests pass against the real seeded DB, not mock arrays.
- [x] `PASS` — Niche decision: not a single-niche lock-in. Parent category
      "Outdoor & Field Gear" created with 3 sub-niche children (Birding Optics,
      Spotting Scopes, Rangefinders) via `scripts/create-outdoor-field-gear-categories.ts`.
      Existing Home Office categories left untouched (kept as backup, per
      PROJECT_PLAN.md §2a).
- [x] `PASS` — Added `BestPage`/`BestPageProduct` Prisma models (no model existed
      before) and `Comparison.categoryId` (mock data always assumed this field;
      the real schema never had it) — both approved by the user before being built.
- [x] `PASS` (checkpoint 1 of the agreed 10-15 article test batch) — Content batch
      1: 2 real products (Vortex Diamondback HD 8x42, Nikon Monarch M5 8x42) + 1
      comparison, Birding Optics (`scripts/content-batch-1-birding-optics.ts`).
- [x] `PASS` (checkpoint 2) — Content batch 2: 4 real products + 2 comparisons —
      Vortex Diamondback HD 20-60x85 vs Celestron Regal M2 20-60x80mm ED (Spotting
      Scopes), Vortex Ranger 1300 vs Leupold RX-1400i TBR/W Gen 2 (Rangefinders)
      (`scripts/content-batch-2-scopes-and-rangefinders.ts`). 9 of 10-15 pieces
      done across all 3 sub-niches; all `seoStatus: DRAFT` pending review. Specs
      sourced from official manufacturer pages this session (see SourceRecord rows
      for exact URLs/dates). One rangefinder considered (Leupold RX-1300i TBR/W)
      turned out discontinued per its own official page — swapped for the current
      RX-1400i TBR/W Gen 2 instead rather than featuring a discontinued product.
- [x] `PASS` — MSRP price labeling: added `ProductOffer.isMsrp` (schema change,
      migration `20260907085721_add_offer_is_msrp`) and threaded it through
      `getLowestPrice`, `ProductCard`, `ComparisonTable`, `WhereToBuy`, and
      `AffiliateButton` — MSRP now renders as "$X MSRP" everywhere a price shows,
      with a disclosure note, never disguised as a live merchant price. The "Best
      price" badge is suppressed when the winning offer is MSRP-only (that badge
      would otherwise misleadingly imply a real price comparison happened). Nikon
      Monarch M5 has no offer price at all (no official MSRP exists, and the one
      real price found was a specialty retailer's, not Amazon's or a manufacturer
      MSRP — attaching it to the Amazon offer row would misattribute it).
- [x] `PASS` — Site rebrand to "OpticsScout": `SITE_NAME` in `lib/seo/metadata.ts`,
      `layout.tsx` title/description, homepage hero copy, `/categories` meta
      description. Deliberately did NOT touch PROJECT_PLAN.md, NICHE_RESEARCH.md,
      TOP2_DECISION.md, AFFILIATE_ECONOMICS.md, MONETIZATION.md, NICHE_VALIDATION.md
      — these are decision records documenting historical context, not live site
      copy, per explicit instruction. Also did not rename package.json's
      `product-discovery-platform` package name or any code comments referencing
      the project's own engineering name (distinct from the site's public brand).
- [ ] `NOT_IMPLEMENTED — REAL IMAGES NEEDED` — All 6 batch-1/2 products have
      `images: []`. Per instruction not to use stock manufacturer images, no images
      were added at all rather than substituting a placeholder. Real, original
      product photography (or a licensed/approved alternative) is a pending item on
      the user's end before these pages could look complete — flagging explicitly
      rather than silently shipping empty image arrays without comment.
- [x] `PASS` — Fixed a real bug found while verifying batch-1 content:
      `ComparisonTable`'s spec-row order relied on `Object.keys()` insertion order,
      but Postgres's `jsonb` column does not preserve authored key order (reorders
      by key length, then alphabetically) — rows were rendering in a scrambled,
      non-deterministic-looking order. Fixed by sorting spec keys alphabetically in
      the component. Affects every future product with a `specifications` JSON
      blob, not just these two — worth knowing before writing the rest of the batch.
- [ ] `NOT_IMPLEMENTED` — About/Author page: methodology section drafted; author
      persona intentionally left as a template for the user to fill in with real
      identity/background rather than inventing one (Section 16 honesty
      requirement — a fabricated author bio would itself be a fabrication).

- [x] `PASS` — Content batch closed at 9 pieces (3 per sub-niche — Birding Optics,
      Spotting Scopes, Rangefinders), per explicit instruction not to force the
      full 10-15. Batch can be extended later once real performance data exists.
- [x] `PASS` — All 7 trust pages built: `/about`, `/how-we-test`,
      `/editorial-policy`, `/affiliate-disclosure`, `/privacy`, `/terms`,
      `/contact`. Static/marketing pages, not DB-backed, `seoStatus: INDEXABLE`,
      added to `sitemap.ts`. New `SiteFooter` component (site-wide nav to all 7)
      rendered in the root layout — distinct from the existing per-page
      `AffiliateDisclosure` snippet, which stays where it was. `/contact` uses a
      real email (`contact@opticsscout.com`, confirmed by the user) rather than a
      form, per instruction. Privacy/Terms content is grounded in what the app
      actually does (anonymous session cookie, no IP/UA storage, no third-party
      analytics yet) — genuinely a draft, not a substitute for real legal review
      before relying on it, especially once AdSense/analytics are added later.

- [x] `PASS` — Fixed 2 issues from the user's live review of the trust pages:
      (1) added a `SiteHeader` component (logo/name linking to "/") rendered in
      the root layout, so every page — including all 7 trust pages — has a way
      back to the homepage without relying on browser back. (2) Added
      `getHomepageCategories()` (filters to categories with a non-null
      `parentId`) and pointed the homepage at it instead of `getAllCategories()`
      — this hides the Home Office categories (Standing Desks, Ergonomic Chairs)
      and the "Outdoor & Field Gear" parent hub itself from the homepage chip
      list, without hardcoding a niche name. Confirmed nothing else breaks:
      `/categories/desks` and `/categories/chairs` remain real pages, still in
      `sitemap.ts` (independent of the homepage), still listed on the full
      `/categories` index page — only the homepage stopped surfacing them.
- [x] `PASS` — Confirmed (not assumed) why `/categories/birding-optics` shows
      "still building out coverage": `categories/[category]/page.tsx` line 64
      filters to `seoStatus === "INDEXABLE"` products before rendering; DB query
      confirms Birding Optics has 2 real products correctly linked via
      `categoryId` (`product_count: 2`), both currently `DRAFT`
      (`indexable_count: 0`). Working as designed, not a bug. No `seoStatus` was
      changed by me — that stays the user's call.

## Immediate next step

Content batch (9 pieces), all 7 trust pages, and the header/footer/homepage-filter
fixes are built and verified (tsc/eslint/vitest 43/43/build all clean). Waiting on
the user's review before touching real product images, writing further content, or
promoting anything to INDEXABLE.

- [x] `PASS` — User approved content review; domain registration paused, so this
      deploy runs on Vercel's own subdomain instead of opticsscout.com for now.
      Added a site-wide noindex safety net (`isOnFinalDomain()` in
      `lib/seo/metadata.ts`) so nothing is indexable while served from anywhere but
      `opticsscout.com`, regardless of a page's own `seoStatus` — applied in
      `robotsDirectiveFor()` (per-page meta), `app/robots.ts` (site-wide
      `Disallow: /` while not on the final domain), and `app/layout.tsx` (root
      metadata default, covering the homepage which has no `generateMetadata` of
      its own). Confirmed images: no `<img>` renders anywhere in the app yet (all
      `product.images` arrays are still `[]`), and both `buildProductJsonLd` and
      `buildMetadata`'s OG/Twitter fields already omit the `image` field entirely
      when empty rather than emitting a broken URL — nothing to fix there.
- [x] `PASS` — Deployed to Vercel (`product-discovery-platform-theta.vercel.app`,
      Vercel project `product-discovery-platform`). Provisioned a fresh Neon
      Postgres database via `vercel integration add neon`, ran the 3 existing
      migrations plus `prisma/seed.ts` and both content-batch scripts once against
      it (all idempotent, safe to re-run). Fixed an unrelated but blocking
      pre-existing bug found during this deploy: `package.json`'s
      `@types/node: "^20"` conflicted with `vitest@5.0.0`'s peer requirement
      (`^22 || >=24`), which passed locally (existing `node_modules` masked it) but
      failed Vercel's `npm install` with `ERESOLVE` — bumped to `^24`, matching
      Vercel's own Node 24.x default; tsc/eslint/vitest all still pass. Build
      command is `prisma generate && prisma migrate deploy && next build`, with
      `DATABASE_URL` overridden to the unpooled Neon connection string for the
      `migrate deploy` step only (Neon's pooled/PgBouncer connection can't hold the
      session-level advisory lock Prisma Migrate needs; the app itself keeps using
      the pooled `DATABASE_URL` for normal queries).
- [x] `PASS` — Promoted all 9 content pieces (6 products, 3 comparisons across
      Birding Optics/Spotting Scopes/Rangefinders) and confirmed all 7 trust pages
      to `seoStatus: INDEXABLE` (trust pages were already hardcoded `INDEXABLE` in
      code). Verified live on the deployed subdomain: all 21 pages return 200,
      every one still carries `noindex, nofollow` (confirms the domain-based
      override works independent of `seoStatus`), and the sitemap now lists the
      promoted URLs. Did not touch the pre-existing Home Office/backup content's
      statuses (`alpha` was already INDEXABLE, `beta`/`gamma` still DRAFT from
      before this session).
      **Caveat not independently re-verified:** 2 of the 6 products' Amazon offer
      URLs (Vortex Diamondback HD 8x42 binoculars, Vortex Ranger 1300 rangefinder —
      both `/s?k=...` search-result links rather than `/dp/...` product pages)
      returned HTTP 503 to a plain `curl` request just before promotion; the other
      4 returned 200. Investigated and resolved in the next entry below.
- [x] `PASS` — Investigated the 2 flagged offer URLs (both `/s?k=...` Amazon
      *search* links rather than real product pages — the other 4 offers all use
      proper `/dp/ASIN` links, so these two were suspect even before the 503s).
      **Vortex Diamondback HD 8x42 binoculars — fixed, was a wrong-URL-type issue,
      not just bot-blocking.** Found and verified the real product page:
      `https://www.amazon.com/dp/B07V3L3KFC` — HTTP 200, `productTitle` reads
      exactly "Vortex Diamondback HD 8x42 Binoculars", "8x42" appears throughout
      the page content. Updated `offer_vortex_db_hd_8x42_amazon`'s `url` in
      production and added a `SourceRecord` documenting the fix. Redeployed;
      confirmed live.
      **Vortex Ranger 1300 rangefinder — NOT fixed, genuinely no valid Amazon
      listing exists; flagged back to the user rather than inventing a URL.** The
      offer's ASIN (`B079HC24XP`, found via search/price-tracker indexing) 404s on
      Amazon under every URL-slug variant tried, while sibling Vortex Ranger models
      (1500, 1800, the general "Ranger" line) have live, working `/dp/` listings —
      ruling out a general testing-method problem. Vortex's own product page
      (vortexoptics.com) confirms the Ranger 1300 is still a current, sold product
      but marked **"LIMITED DISTRIBUTION"** (Vortex's own term for lines sold only
      through their authorized specialty-dealer network, deliberately excluded from
      mass marketplaces like Amazon) — consistent with there being no real Amazon
      listing to link to, not a temporary stock-out. A real, correctly-titled
      listing does exist at a non-Amazon retailer (MidwayUSA,
      `https://www.midwayusa.com/product/1019638617`, title confirmed as "Vortex
      Optics Ranger 1300 Laser Rangefinder 6x") as one possible alternative. Left
      the DB offer row untouched pending the user's decision on how to handle a
      product that may not be legitimately sellable via Amazon at all.
- [x] `PASS` — Per the user's decision: swapped `offer_vortex_ranger_amazon`'s
      merchant from Amazon to a new `Merchant` row (`merchant_midwayusa`,
      MidwayUSA), URL updated to the verified `https://www.midwayusa.com/product/1019638617`.
      No affiliate account with MidwayUSA yet, so this is deliberately a plain
      link — `affiliateNetwork` is set to `IMPACT` as an **unconfirmed
      placeholder only** (there's no `NONE`/`TBD` value in the `AffiliateNetwork`
      enum, and `IMPACT` has no adapter implemented in
      `lib/affiliate/adapters`, so `getAffiliateUrl()` safely falls back to a
      plain, untagged link regardless — verified `isAffiliateLink: false`
      behavior, no code changes needed). Initial research suggests MidwayUSA's
      actual program runs through FlexOffers/Sovrn, not Impact — **do not treat
      `IMPACT` on this merchant row as a real fact; it needs real research before
      ever applying**, same caveat status as OpticsPlanet's contested network
      info in `docs/AFFILIATE_ECONOMICS.md`. **Candidate for a future affiliate
      application** — add MidwayUSA to the same affiliate-diversification
      research/application list as OpticsPlanet once ready to pursue it.
      Documented via a new `SourceRecord` on the product. Re-verified after
      redeploy: live product page renders merchant name "MidwayUSA" and the
      correct URL; the MidwayUSA URL itself 403s to `curl`/WebFetch's raw fetch
      (bot-blocking — same pattern as Amazon and OpticsPlanet earlier in this
      doc) but a `WebFetch` render confirmed it's a real, matching page (title
      "Vortex Optics Ranger 1300 Laser Rangefinder 6x"), not a 404/error.

- [x] `PASS` — Full production-readiness audit + hardening pass (code changes
      only — **not yet deployed to production**; build/route-verified via a
      Vercel *preview* deployment per this task's explicit "do not run `vercel
      --prod`" rule, so production still runs the pre-audit code until someone
      explicitly redeploys). Confirmed via direct code read + a real preview
      build, not assumed:
      - **Fixed a real duplicate-JSON-LD bug**: `compare/[slug]`, `best/[slug]`,
        `alternatives/[slug]`, `guides/[slug]`, and `categories/[category]` were
        all rendering `<Breadcrumbs>` (which itself emits `BreadcrumbList`
        JSON-LD) AND a second, separate `<JsonLd data={buildBreadcrumbJsonLd(...)}>`
        with identical content — two duplicate schema blocks per page. Only
        `products/[slug]` was already correct. Removed the redundant call in all
        5 files; verified live on preview: compare/categories/alternatives pages
        now emit exactly 1 `BreadcrumbList` block (was 2).
      - **Removed a fabricated "Top pick" badge** on `/compare/[slug]` (hardcoded
        `tableProducts[0].bestForLabel = "Top pick"`, unconditionally, regardless
        of any real ranking) and `/best/[slug]` (badge on card index 0). Both were
        driven purely by array/DB insertion order, not any documented editorial
        ranking — and directly contradicted this site's own real verdict text in
        at least one live case (the Diamondback/Monarch M5 comparison's verdict
        explicitly says "Neither is the wrong choice; the right one depends..."
        while the UI was simultaneously badging the Diamondback "Top pick").
        Verified live on preview: no "Top pick" text anywhere on the rendered
        compare page now; the real `verdict` prose is unchanged and still shown.
      - **Added a custom `not-found.tsx`**: previously a broken/mistyped URL fell
        through to Next's bare, unbranded default 404 (confirmed live on
        production before this fix — no header/footer/nav, no way back into the
        site). New page uses the existing design tokens, links home and to
        `/categories`. Verified live on preview.
      - **Added a specifications table + source citation to `/products/[slug]`**:
        the product page previously showed verdict/pros/cons but never rendered
        `Product.specifications` at all (only `/compare` pages did, via
        `ComparisonTable`) — a real, sourced JSON field going completely unused
        on the page it belongs to most. Added `ProductSpecifications` (shares
        `formatSpecLabel`/`formatSpecValue`/`getSortedSpecKeys` with
        `ComparisonTable` via new `lib/content/specifications.ts`, extracted so
        the two never drift) plus a `getProductBySlug()` addition that computes
        a real `"Source: X — Last verified: [actual SourceRecord.retrievedAt]"`
        line from that product's own `SourceRecord` rows — never a fabricated
        date. Handles one pre-existing data quirk found while verifying against
        real data: one `SourceRecord` (Leupold RX-1400i) stores `field` as a
        comma-separated list instead of one row per field; matching now splits on
        `,` so that row isn't silently dropped. Verified against all 6 live
        optics products via a direct query — 6/6 resolve a real source name and
        date; verified the rendered HTML live on preview (spec table + "Source:
        Vortex Optics official product page — Last verified: September 7, 2026"
        for the Diamondback HD 8x42).
      - **Fixed real search gaps** (Phase 6 test terms from the audit brief):
        `searchContent()` previously matched only `product.name` — "binoculars",
        "rangefinder", and "spotting scope" all returned zero results despite
        being exactly the kind of query a real visitor would type (no product
        name contains those words; they're in `shortDescription` instead, and
        "binoculars" is plural where the copy says "binocular"). Expanded the
        matched corpus to include `brand`/`shortDescription`, and added a minimal
        trailing-"s" singular fallback (no tokenizer/external search service
        added). Verified live on preview: all 6 required test queries (Vortex,
        Nikon, 8x42, binoculars, rangefinder, spotting scope) now return the
        correct products.
      - **Confirmed, did not change** (verified true, not assumed): canonical
        paths/unique metaTitle+metaDescription on all 9 live pieces; robots.txt +
        per-page noindex meta both still correctly block everything on the
        Vercel subdomain; sitemap has no duplicate/phantom/temp-domain URLs (23
        entries, all real, all INDEXABLE-only); affiliate click redirect
        (`/api/click/[productId]/[merchantId]`) tested live on production for
        both the Amazon and MidwayUSA offers — correct destination, no loop, no
        internal detail leaked, graceful 404 for a bad id; no `<img>` tags
        anywhere so no broken-image risk; no hardcoded reference to the temporary
        `*.vercel.app` domain anywhere in source (only a code comment mentions
        it); JSON-LD never fabricates `aggregateRating`/sku/mpn (correctly
        omitted — no such real field exists in the data model).
      - **Known, not fixed — flagged, not a blocker**: 11 of 43 vitest tests
        (the DB-backed integration suite) fail locally with connection timeouts.
        Root cause is this dev machine's local network silently dropping
        Postgres's plaintext SSL-negotiation handshake (diagnosed earlier this
        session; unrelated to this change — raw TLS and HTTPS both work fine
        locally, only the Postgres wire protocol's SSLRequest step is affected).
        Not a code regression: the same 32 non-DB tests still pass, `tsc`/`eslint`
        are clean, and the real production build (run via Vercel, which doesn't
        have this local restriction) succeeded cleanly with all 36 routes
        generated. `.env`'s `DATABASE_URL` was also found pointing at a different,
        seemingly-unrelated Neon project (eu-central-1) than the one actually
        provisioned and deployed this project (`.env.local`, us-east-1) — left
        untouched since its origin is unclear, but worth the user's attention;
        local `npm test`/`vitest` won't work correctly until it's reconciled.
