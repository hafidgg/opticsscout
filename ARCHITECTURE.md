# ARCHITECTURE.md

## 1. Stack

| Layer          | Choice                              | Why |
|----------------|--------------------------------------|-----|
| Framework      | Next.js 16 (App Router)             | Server Components + streaming for fast, low-JS SEO pages; file-based routing maps cleanly onto the required IA. |
| Language       | TypeScript (strict)                 | Type-safe data model shared between DB layer, server actions, and UI. |
| Styling        | Tailwind CSS v4                     | Fast to build a clean editorial design without heavy CSS-in-JS runtime cost. |
| Database       | PostgreSQL                          | Relational integrity for Product/Offer/Merchant graph; native full-text search (`tsvector`) covers MVP search without an external search service. |
| ORM            | Prisma 7 (stable, pinned)            | Type-safe schema, migrations, good DX. Pinned to 7.10.0 rather than the 8.0.0-rc line that a transitive dependency resolution pulled in during install — see `NOTES_DEPENDENCIES.md`. |
| Validation     | Zod                                  | Single source of truth for runtime validation of form input, server action payloads, and structured-data shape before emission. |
| Rendering      | Server Components by default        | Minimal client JS; client components only where interactivity is required (compare table sort, search-as-you-type, admin forms). |

No additional libraries (state management, UI kits, animation libraries, CMS) are added
at this stage — each would need to justify itself against a concrete unmet need, per the
brief's "no dependency without a reason" rule.

## 2. Directory Structure

```
src/
  app/
    (marketing)/
      page.tsx                      → /
      about/page.tsx                → /about
      how-we-test/page.tsx          → /how-we-test
      editorial-policy/page.tsx     → /editorial-policy
      affiliate-disclosure/page.tsx → /affiliate-disclosure
      privacy/page.tsx              → /privacy
      terms/page.tsx                → /terms
      contact/page.tsx              → /contact
    categories/
      page.tsx                      → /categories
      [category]/page.tsx           → /categories/[category]
    products/
      page.tsx                      → /products
      [slug]/page.tsx               → /products/[slug]
    compare/
      [slug]/page.tsx               → /compare/[slug]
    best/
      [slug]/page.tsx               → /best/[slug]
    alternatives/
      [slug]/page.tsx               → /alternatives/[slug]
    gifts/
      [slug]/page.tsx               → /gifts/[slug]
    guides/
      [slug]/page.tsx               → /guides/[slug]
    search/page.tsx                 → /search
    deals/page.tsx                  → /deals
    admin/                          → protected, minimal (Phase 3+)
    api/
      click/[productId]/[merchantId]/route.ts  → affiliate redirect + tracking
      sitemap/route.ts (or sitemap.ts convention)
    sitemap.ts                      → Next.js native sitemap generation
    robots.ts                       → Next.js native robots generation
    layout.tsx
    globals.css
  lib/
    db/                  → Prisma client singleton
    affiliate/            → getAffiliateUrl(), adapters, config
      adapters/
        amazon.ts
        ebay.ts
        etsy.ts
        awin.ts
        types.ts          → MerchantAdapter interface
    seo/
      metadata.ts          → dynamic metadata builders
      structured-data.ts   → JSON-LD builders (Product, Offer, Breadcrumb, Article, FAQ)
      quality-gate.ts      → indexability scoring
    recommendation/
      engine.ts            → scoring/ranking engine
      types.ts
    comparison/
      engine.ts
    linking/
      internal-links.ts    → relationship resolver
    validation/
      schemas.ts           → Zod schemas
    mock-data/
      products.ts, merchants.ts, offers.ts  → clearly labeled MOCK_ data
  components/
    ui/                    → generic building blocks (Card, Table, Badge, Button)
    affiliate/
      AffiliateDisclosure.tsx
      AffiliateButton.tsx
    product/
    comparison/
    seo/
      JsonLd.tsx
prisma/
  schema.prisma
  seed.ts
tests/
  unit/
  integration/
```

## 3. Merchant Abstraction

`lib/affiliate/adapters/types.ts` defines:

```ts
interface MerchantAdapter {
  merchantSlug: string;
  buildAffiliateUrl(input: { destinationUrl: string; productId: string; campaign?: string }): string;
  isConfigured(): boolean; // false when required env credentials are absent
}
```

Each of `AmazonAdapter`, `EbayAdapter`, `EtsyAdapter`, `AwinAdapter` implements this
interface. `getAffiliateUrl(offer)` in `lib/affiliate/index.ts` looks up the adapter by
`offer.merchant.affiliateNetwork` and delegates — no merchant-specific branching anywhere
else in the app. When an adapter's `isConfigured()` is false (no env credential set), it
returns the plain destination URL and the offer is flagged so the UI can label it "BLOCKED
— EXTERNAL CREDENTIAL REQUIRED" internally (never shown as a real broken link to users;
the app must work with zero credentials configured).

## 4. Data Flow: Product vs Offer

```
Product (id, slug, canonical spec/editorial content)
   │
   ├── ProductOffer (Amazon, price $X, affiliateUrl)
   ├── ProductOffer (eBay, price $Y, affiliateUrl)
   └── ProductOffer (Etsy, price $Z, affiliateUrl)
```

The comparison and recommendation engines operate on `Product` + aggregated `ProductOffer`
data (e.g. lowest current price across merchants), never on a single merchant's listing as
if it were the whole product.

## 5. SEO Subsystem

- `app/sitemap.ts` / `app/robots.ts` use Next.js native conventions.
- Every indexable route's metadata is generated server-side via `lib/seo/metadata.ts`,
  pulling canonical URL, OG/Twitter tags, and title/description from the Product/Guide/
  Comparison record.
- `lib/seo/quality-gate.ts` computes a page's status (DRAFT/REVIEW/READY/INDEXABLE/
  NOINDEX/ARCHIVED) from concrete signals (see SEO_STRATEGY.md). Only `INDEXABLE` pages
  emit `robots: index, follow`; everything else emits `noindex`.
- Structured data is built from validated Zod-typed data — never from freeform strings —
  so JSON-LD always matches actual DB content.

## 6. Click Tracking

`GET /api/click/[productId]/[merchantId]` — resolves the `ProductOffer`, resolves the
affiliate URL via the adapter, records a first-party `ClickEvent` (product, merchant,
page, placement, timestamp, anonymous session id — no PII), then issues a 302 redirect to
the affiliate URL. No client-side tracking pixel is required for the core event.

## 7. Known Conflicts / Decisions Requiring No Further Input

- **Prisma version:** pinned to 7.10.0 stable rather than the 8.0.0-rc line — documented
  in `NOTES_DEPENDENCIES.md`. This is a maintainability decision, not a conflict requiring
  your input.
- **Search:** PostgreSQL full-text search for MVP, per Section 27's explicit allowance;
  no external search service added.
- **No CMS:** content lives in Postgres via Prisma; guides/comparisons are structured DB
  records, not markdown files, so the Quality Gate and internal linking engine can query
  them relationally.
