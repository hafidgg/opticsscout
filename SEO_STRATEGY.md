# SEO_STRATEGY.md

## 1. Principle

Every indexable page must satisfy real search intent with content that could not be
produced by concatenating a product name, price, and affiliate button (Section 2). SEO is
implemented as a subsystem with explicit gates, not an emergent property of "publishing a
lot of pages."

## 2. Page Types & Intent Templates

| Route | Search intent | Programmatic template |
|---|---|---|
| `/best/[slug]` | "best X", "best X under $Y", "best X for [audience/use-case]" | `best/{product-type}[-under-{price}][-for-{audience-or-use-case}]` |
| `/compare/[slug]` | "X vs Y" | `compare/{product-a}-vs-{product-b}` |
| `/alternatives/[slug]` | "alternatives to X" | `alternatives/{product}` |
| `/gifts/[slug]` | "gifts for X" | `gifts/{audience}` |
| `/guides/[slug]` | long-form buying guidance | editorial, not purely templated |
| `/products/[slug]` | branded/model lookup | one page per real Product |
| `/categories/[category]` | category hub / browse | one page per real Category |

Programmatic generation (Section 13) is restricted to `/best`, `/compare`, `/alternatives`,
`/gifts` — and only becomes indexable after passing the Quality Gate (Section 4 below).
Templates are never mass-published pre-gate.

## 3. Technical SEO Implementation

- **Metadata:** `generateMetadata()` per route reads `metaTitle`/`metaDescription`/
  `canonicalPath` from the DB record. No route ships with framework-default metadata.
- **Canonical URLs:** always the clean, lowercase, tracking-param-free path (Section 32).
  Affiliate tracking lives only in the outbound `affiliateUrl`, never in the canonical.
- **Robots:** `app/robots.ts` (Next.js convention) disallows `/admin`, `/api`, and any
  path segment matching a non-`INDEXABLE` `seoStatus`.
- **Sitemap:** `app/sitemap.ts` queries only records where `seoStatus = INDEXABLE`. A
  sitemap index is introduced once entry count approaches ~40k (Next.js/Google's
  practical single-sitemap ceiling) — not needed at MVP scale.
- **Structured data:** JSON-LD `Product`, `Offer`, `BreadcrumbList` on product pages;
  `Article` on guides; `FAQPage` only where a guide has genuine, non-padded FAQ content.
  No `Review`/`AggregateRating` schema is emitted unless `rating`/`reviewCount` are
  non-null and sourced (Section 12: never fabricate ratings).
- **Breadcrumbs:** derived from Category → Product / Category → Guide relationships,
  rendered as both UI and matching JSON-LD.
- **404 / redirects:** Next.js `notFound()` for missing slugs; a `Redirect` mechanism is
  a documented Phase 2+ admin feature (not built at MVP scope) — until then, deleted
  content sets `seoStatus = ARCHIVED` and returns 410-equivalent messaging rather than a
  broken 200.

## 4. Quality Gate

Before any page (especially programmatic `/best`, `/compare`, `/alternatives`, `/gifts`)
can hold `seoStatus = INDEXABLE`, `lib/seo/quality-gate.ts` checks:

1. **Sufficient unique content** — editorial fields (`verdict`, `whoItsFor`, guide
   `content`) are non-empty and exceed a minimum length threshold (not just present).
2. **Sufficient product coverage** — a `/best` or `/compare` page references at least the
   minimum number of real `Product` records its template requires (e.g. a comparison
   needs ≥2 products with real specs, not placeholders).
3. **Valid product data** — referenced products have no `UNKNOWN`-only spec sets; a
   comparison of two products with no comparable spec fields fails the gate.
4. **No empty sections** — a template section (e.g. "who this is for") is either filled
   or the section is omitted from render — never shipped empty.
5. **No broken affiliate links** — every referenced `ProductOffer.url` resolves (checked
   at content-publish time, not per-request).
6. **Metadata complete** — `metaTitle`, `metaDescription`, `canonicalPath` all present.
7. **No duplicate/cannibalizing intent** — a new `/best` or `/compare` slug is checked
   against existing slugs targeting materially the same intent (see Section 5 below)
   before being allowed past `READY`.
8. **Internal links present** — the page links to ≥1 related Category/Guide/Product.

Statuses: `DRAFT` (being authored) → `REVIEW` (complete, awaiting the gate check) →
`READY` (passed automated gate, awaiting optional human review) → `INDEXABLE` (live,
crawlable) → `NOINDEX` (exists, intentionally excluded — e.g. thin content kept for UX
continuity) → `ARCHIVED` (retired).

The gate is implemented as a pure function returning a pass/fail result with the specific
failing checks listed — not a black-box score — so failures are actionable and auditable.

## 5. Duplicate Content & Cannibalization Prevention

- Slug generation for programmatic pages is deterministic from template + inputs, which
  prevents accidental exact duplicates.
- Before publishing a new `/best` or `/compare` page, the gate checks existing pages
  sharing the same primary category + significantly overlapping product set; if overlap
  exceeds a configured threshold, the new page is held at `REVIEW` for manual
  disambiguation (e.g. merge, or clarify differentiated intent) rather than auto-published.
- Guides and comparisons targeting the same core keyword are surfaced together at
  authoring time via `intent` field similarity, not silently allowed to compete.

## 6. Core Web Vitals

- Server Components by default; client components isolated to interactive islands
  (compare-table sort/filter, search input).
- Images use `next/image` with explicit dimensions to avoid CLS.
- No render-blocking third-party scripts on core content routes; AdSense script loads
  are deferred/async once activated (Section 20).

## 7. Status

`NOT_IMPLEMENTED` (design complete, code pending) for the Quality Gate function and
structured-data builders — tracked in TODO.md Phase 2.
