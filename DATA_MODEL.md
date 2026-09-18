# DATA_MODEL.md

## 1. Design Principles

- **Product ≠ Offer.** A physical product is one row; its availability at Amazon, eBay,
  and Etsy are separate `ProductOffer` rows pointing at the same `Product`. This is the
  foundation of the comparison/merchant-availability engine (Section 8/9).
- **Provenance is first-class.** Every important product fact can be traced to a
  `SourceRecord` (source, URL, retrieval date, confidence). Nothing is silently invented;
  unknown fields are `null`/`UNKNOWN`, never guessed (Section 30).
- **SEO metadata is first-class**, not bolted on — `SeoStatus` and metadata fields live on
  the content models themselves (`Product`, `Guide`, `Comparison`), not in a separate
  loosely-coupled table.
- **Quality Gate status is an enum on content**, not a boolean, so partial progress
  (DRAFT → REVIEW → READY → INDEXABLE) is representable and queryable.

## 2. Prisma Schema

See `prisma/schema.prisma` for the authoritative, compiling version. Summary below.

### Core commerce models

**Category**
- `id, name, slug, description, parentId (self-relation for subcategories)`

**Product**
- `id, name, slug, brand, description, shortDescription`
- `categoryId, subcategoryId`
- `images (String[])`
- `specifications (Json)` — structured key/value spec data
- `features (String[])`, `pros (String[])`, `cons (String[])`
- `whoItsFor`, `whoShouldAvoid` (Text, editorial)
- `verdict` (Text, editorial)
- `rating (Float?)`, `reviewCount (Int?)` — nullable; never fabricated (Section 37)
- `seoStatus (SeoStatus enum)`, `metaTitle`, `metaDescription`, `canonicalPath`
- `createdAt, updatedAt`
- relations: `offers ProductOffer[]`, `sourceRecords SourceRecord[]`,
  `comparisonsAsA/B`, `guides` (implicit many-to-many via join), `alternatives`
  (self-relation)

**Merchant**
- `id, name, slug, website, affiliateNetwork (AffiliateNetwork enum), affiliateProgram, active (Boolean)`

**ProductOffer**
- `id, productId, merchantId`
- `url` (canonical destination, no tracking params — Section 32)
- `affiliateUrl` (generated, stored for audit/debugging, never hand-edited)
- `price (Decimal?)`, `currency (String, default "USD")`
- `availability (AvailabilityStatus enum)`
- `lastChecked (DateTime?)`
- `trackingMetadata (Json?)` — campaign/placement metadata, no PII
- unique constraint on `(productId, merchantId)` — one offer per merchant per product

**Comparison**
- `id, slug, title, verdict (Text)`
- `products` — many-to-many join to `Product` (`ComparisonProduct` explicit join table
  to preserve ordering/position)
- `seoStatus, metaTitle, metaDescription, canonicalPath`
- `createdAt, updatedAt`

**Guide**
- `id, slug, title, intent (Text — the search intent this page targets)`
- `content (Text — long-form editorial body, markdown or structured blocks)`
- `products` — many-to-many join (`GuideProduct`)
- `categoryId`
- `seoStatus, metaTitle, metaDescription, canonicalPath`
- `updatedAt`

### Provenance

**SourceRecord**
- `id, productId, source (String), sourceUrl, retrievedAt (DateTime)`
- `field (String — which Product field this supports)`
- `value (String)`, `confidence (ConfidenceLevel enum: LOW/MEDIUM/HIGH)`

### Tracking

**ClickEvent**
- `id, productId, merchantId, page (String), placement (String)`
- `sessionId (String — anonymous, not tied to user identity)`
- `createdAt (DateTime)`
- No IP, no user-agent, no email — deliberately minimal (Section 18: privacy-conscious).

### Enums

```
SeoStatus       = DRAFT | REVIEW | READY | INDEXABLE | NOINDEX | ARCHIVED
AffiliateNetwork = AMAZON | EBAY | ETSY | AWIN | IMPACT | CJ | ENVATO | GUMROAD
AvailabilityStatus = IN_STOCK | OUT_OF_STOCK | UNKNOWN | DISCONTINUED
ConfidenceLevel = LOW | MEDIUM | HIGH
```

## 3. Deliberate Omissions for MVP

- No `User` / auth model yet — admin protection in Phase 1 is a single shared secret via
  middleware, not a full user table, per Section 28 ("don't overbuild the admin
  initially"). A `User`/`AdminAccount` model is a documented next step, not built now.
- No `Review` model — Section 12/16 explicitly forbid fabricating reviews; if/when real
  review data sources exist, this model will be added with mandatory `SourceRecord`
  linkage.

## 4. Status

`PASS` — schema written and (see TODO.md) validated via `prisma validate` /
`prisma generate` before first migration.
