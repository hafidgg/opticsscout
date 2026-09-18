# SEO_AUDIT.md

Status as of Phase 3 completion (2026-09-05). This file is updated incrementally as
phases complete — it is not written once at the end (Section 40 requires an audit
report; keeping it current avoids a last-minute unverifiable summary).

## Indexable Routes (currently, verified live)

Exactly 4, confirmed via a live curl of /sitemap.xml:
- / (homepage, static)
- /categories (static index)
- /categories/desks (has >=1 INDEXABLE product)
- /products/alpha-electric-standing-desk-48in (the one deliberately-promoted record)

/categories/chairs is correctly **absent** — its one product (gamma) is DRAFT.
No /compare, /best, /guides, or /alternatives entry exists yet — every mock record of
those types is deliberately below the INDEXABLE threshold (REVIEW, READY, or DRAFT
respectively), serving as control cases proving the gate/sitemap filter holds as
content types multiply, not just for the single content type tested in Phase 2.

## Noindex / Not-Found Routes

- /api/*, /admin* — disallowed in robots.txt entirely (unchanged from Phase 2)
- /search — always noindex regardless of query (utility surface, not a content type)
- Any Product/Comparison/Guide/Best-page at seoStatus other than INDEXABLE — the
  route itself returns HTTP 404 (verified live for DRAFT, REVIEW, and READY cases),
  not merely a noindex-but-visible page. There is no admin/preview auth yet, so this
  is the safer behavior until one exists.

## Canonical Strategy

Unchanged from Phase 2 — canonical paths come from each record's canonicalPath field
via buildMetadata(). Verified live: the promoted product's canonical URL matches its
actual route path exactly.

## Sitemap Strategy

Extended in Phase 3 to cover 5 content-type resolvers (getIndexableProductPaths,
getIndexableComparisonPaths, getIndexableGuidePaths, getIndexableBestPagePaths,
getIndexableCategoryPaths), all enforcing the identical seoStatus === "INDEXABLE"
filter (categories use a derived rule: indexable iff >=1 indexable product). Live-curled
output matches expectations exactly — see TODO.md Phase 3 evidence.

## Structured Data

Verified live on the one real indexable page (not just unit-tested against synthetic
inputs): the Alpha product page emits a Product JSON-LD node with two real Offer
entries (Amazon, eBay — correct prices, correct availability mapping to
https://schema.org/InStock), no aggregateRating block (correctly absent — rating and
reviewCount are null), and a BreadcrumbList whose 3 entries match the real Home ->
Standing Desks -> product hierarchy. Article JSON-LD is wired on the Guide route (not
yet visible live, since no guide is INDEXABLE) but the builder itself was unit-tested
in Phase 2.

## Internal Linking

Product -> Category and Product -> Alternatives resolvers (Phase 2) are now exercised
by real routes: /products/[slug] renders a "Related" section from
getRelatedLinksForProduct(), and /alternatives/[slug] is a full page built from the
same real Product.alternatives-mirroring relationship. Guide <-> Product and
Comparison <-> Product linking exist as data (Guide/Comparison pages list their
constituent products as ProductCards) but a dedicated "appears in these guides"
back-link on the product page itself is not yet built — flagged as a Phase 4+ item.

## Duplicate/Thin-Content Prevention

Unchanged mechanism from Phase 2, now exercised against real (mock) Comparison/Best
records via the repository layer (findOverlappingIntent called for both) — verified
via the integration test suite that the gate correctly evaluates these on real
content, not only synthetic gate-test inputs.

## Affiliate Disclosure & Click Tracking

AffiliateDisclosure is now placed on every content page that renders (products,
compare, best, alternatives, guides, homepage). AffiliateButton/WhereToBuy route every
merchant offer through /api/click/[productId]/[merchantId], verified live: a real
request against the Alpha product's Amazon offer returned an actual 302 to the mock
Amazon destination URL with a correctly-scoped anonymous session cookie (no PII,
HttpOnly, SameSite=lax).

## Core Web Vitals Considerations

Unchanged from Phase 2 (Server Components by default, no Google Fonts network
dependency). Mock products still have empty images arrays, so next/image adoption
remains unverified against real images — still a Phase 4+/real-content item.

## What Remains Before Real Production Content Pages

1. Prisma Client generated with real network access (still BLOCKED — EXTERNAL
   NETWORK ACCESS REQUIRED in this sandbox) — swaps the mock-data repository for real
   Postgres-backed content without changing the gate/route contract.
2. Real, human-authored editorial content for at least the Comparison/Guide/Best-page
   types (the mock REVIEW/READY examples prove the pipeline works but aren't meant to
   ship) — and an explicit human decision to promote them to INDEXABLE.
3. /gifts/[slug], trust pages (/about, /how-we-test, etc.), AdSense slots, and /admin
   — none built yet, out of Phase 3's explicit scope.
4. Real niche/market/affiliate-program validation — per explicit instruction, the
   next step is validation, not mass page generation.
