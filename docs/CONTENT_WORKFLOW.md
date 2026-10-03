# Content Workflow

How editorial content (Products, Comparisons, Guides, BestPages) gets into the
database and goes live. Affiliate offers have their own guide in
`docs/AFFILIATE_MARKETING.md`; what to write next is in `docs/SEO_CONTENT_ROADMAP.md`.

## The lifecycle

1. **Write a content-batch script** — `scripts/content-batch-N-<topic>.ts`. Every
   value comes from existing, sourced data (specs, MSRP, `SourceRecord` citations).
   No invented prices, ratings, or "tested" claims.
2. **Run it** — creates the rows as `seoStatus: DRAFT`. DRAFT pages 404 at their own
   URL, are excluded from `sitemap.xml`, and don't appear in category "Best of" /
   "Comparisons" sections.
3. **Review** the exact rendered copy (temporarily promote with
   `scripts/set-seo-status.ts` for a preview if needed, then set it back).
4. **Promote** after approval:
   `npx tsx scripts/set-seo-status.ts <product|comparison|guide|bestPage> <id> INDEXABLE`.
   Sitemap, category links, and robots `index, follow` follow from `seoStatus`
   (indexing additionally requires being on the final domain — see
   `isOnFinalDomain()` in `src/lib/seo/metadata.ts`) — **but only after the next
   build** (see below).

## Rule: a database change goes live only on the next build

Content pages are statically generated at build time (no `revalidate`), and every
push to `main` auto-deploys to production via Vercel's GitHub integration. A
database-only change — a promotion via `set-seo-status.ts`, a content-script re-run,
an offer price change — does **not** reach the live site until something rebuilds it.
Until then the old version stays cached; a page promoted after its build keeps
returning 404 and stays out of the sitemap.

So, for any content change:

- **Change the database first, then push**: the deploy builds with the new data. Or,
- **if the deploy already ran**, trigger a rebuild with an empty commit:
  `git commit --allow-empty -m "Rebuild to publish <what>"` and push.

Then verify live (status code, sitemap) — never assume a DB change is live.
Learned 2026-10-03: the "Budget vs Premium Rangefinder" guide, promoted after its
deploy, stayed 404 until an empty-commit rebuild (`e00ef7a`).

## Rule: seoStatus is create-only in content scripts

Content-batch scripts are idempotent upserts, and they get re-run — to fix a typo,
tweak a verdict, re-apply an edit. If the upsert's `update` contained
`seoStatus: "DRAFT"`, every re-run would **silently demote a live, indexed page**,
pulling it from the sitemap and search results with no error.

So every content-batch script sets `seoStatus` on **create only** and strips it from
**update**:

```ts
// seoStatus is written on CREATE only ... See docs/CONTENT_WORKFLOW.md.
function withoutSeoStatus<T extends { seoStatus?: unknown }>(data: T): Omit<T, "seoStatus"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { seoStatus, ...rest } = data;
  return rest;
}

await prisma.bestPage.upsert({
  where: { id: BEST_PAGE_ID },
  create: bestPage,                   // includes seoStatus: "DRAFT" -> new rows start as DRAFT
  update: withoutSeoStatus(bestPage), // existing rows keep whatever status they have
});
```

The only thing that changes `seoStatus` on an existing row is
`scripts/set-seo-status.ts` — an explicit, auditable step. Apply this to every model
that has `seoStatus` (Product, Comparison, Guide, BestPage). Don't "simplify" it back
to `update: data`.

Applied in: `content-batch-1` through `content-batch-4`.

## Structured data: Offers only for verified retailer prices

Product-page JSON-LD (`buildProductJsonLd` in `src/lib/seo/structured-data.ts`) emits
an `Offer` only for offers with a real price **and** `isMsrp: false`. An `Offer` node
asserts that its `seller` sells at that price; an MSRP isn't that, so MSRP-only offers
are left out of JSON-LD (the visible page still shows them, labeled "MSRP").

As of 2026-10-01 every priced offer is MSRP, so no product emits an `Offer`, and with no
`review`/`aggregateRating` either, Product nodes aren't product-snippet eligible yet.
Accepted trade-off. Once any offer gets a verified retailer price (set `price` with
`isMsrp: false`, e.g. via `scripts/add-offer.ts`), its `Offer` appears automatically — a
data change, no code change.

**Product node omitted when it would be invalid** (2026-10-01 — read before
re-opening): Google requires a Product to carry one of `offers` / `review` /
`aggregateRating`, and reports one without as an invalid item ("Must define 'offers',
'review', or 'aggregateRating'"). After the rule above, every current product has none
of the three. So `buildProductJsonLd` returns `null` and the product page emits **no
Product JSON-LD at all** — never a partial/invalid node. BreadcrumbList and the
site-wide Organization/WebSite JSON-LD are unaffected. Nothing is lost: an invalid
node was never rich-result eligible, and structured-data errors aren't a ranking
penalty. The Product node reappears automatically, with no code change, once a
product gets a verified retailer price (`isMsrp: false`) or a real rating.

Why not mark the MSRP as a list price instead? schema.org does have
`UnitPriceSpecification.priceType` with `https://schema.org/ListPrice`,
`https://schema.org/MSRP`, `https://schema.org/SRP`, etc. But Google only accepts a
typed price **in addition to** an active selling price:
- Its merchant listing doc says "Don't mark the active price with a `priceType`
  property". A `StrikethroughPrice`/`ListPrice` needs "a current sale price" on the
  same Offer.
- Its product snippet doc defines `price` / `priceSpecification.price` as "the offer
  price of a product", with no mention of `priceType`.

So an Offer whose only price is a `priceType: MSRP` is either rejected (no active
price), or Google reads the MSRP as the seller's offer price. That is exactly the
misrepresentation this rule exists to prevent. There is no honest way to put an
MSRP-only Offer in Google's markup.

What brings a valid Product node back: a verified retailer price (`isMsrp: false`), or
real reviews/ratings. **Never** fabricate availability, reviews, or ratings to satisfy it.

Search Console "Merchant listing" warnings (missing image / availability /
shippingDetails / hasMerchantReturnPolicy) don't apply to this site: Google's docs state
merchant listings are only for pages where a shopper can buy, "not pages with links to
other sites that sell the product." Never fabricate those fields to silence them.

## Caution: batch scripts are not a source of truth for later fixes

A batch script reflects the data as of when it was written. Fixes made afterwards
directly in the database (e.g. via `scripts/add-offer.ts`) are **not** back-ported into
the old batch script. Known cases:

- `content-batch-1`: the Vortex Diamondback HD 8x42 Amazon offer URL in the script is
  the old `/s?k=` search link; production was fixed to `/dp/B07V3L3KFC` (2026-09-18).
- `content-batch-2`: the script still creates the Vortex Ranger 1300 offer as an
  Amazon offer; production swapped it to MidwayUSA (2026-09-18).

Re-running batch 1 or 2 against production would revert those fixes. Before re-running
any older batch script, diff its values against the live rows first — or write a new,
narrowly scoped script for the change you actually need.
