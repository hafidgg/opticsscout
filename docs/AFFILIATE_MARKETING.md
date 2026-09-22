# Affiliate Marketing Layer

This documents the **existing** `ProductOffer`/`Merchant` architecture, extended
(2026-09) with an `active` flag and an `AVANTLINK` network entry — it is not a new
or parallel system. If you're looking for "where do I add a real affiliate offer,"
skip to [How to add an offer](#how-to-add-an-offer-to-a-product) below.

## Architecture

Three tables, already in `prisma/schema.prisma`, drive everything:

- **`Merchant`** — one row per retailer/network relationship (Amazon, MidwayUSA, and
  eventually OpticsPlanet/B&H/Adorama/Swarovski/Vortex/etc.). Has its own `active`
  flag — an account-level kill switch independent of any individual offer.
- **`ProductOffer`** — one row per (product, merchant) pair — enforced by a real
  `@@unique([productId, merchantId])` constraint, so this can never silently
  duplicate. Holds the destination `url`, `price`/`currency`/`isMsrp`, `availability`,
  `lastChecked`, and (new) `active`.
- **`ClickEvent`** — the click-tracking log (see [How click tracking works](#how-click-tracking-works)).

Every affiliate URL is built in exactly one place: `getAffiliateUrl()` in
`src/lib/affiliate/index.ts`, which dispatches to a per-network adapter
(`src/lib/affiliate/adapters/*.ts`, one shared `MerchantAdapter` interface). No
component or route ever constructs an affiliate link by hand.

## `productUrl` vs `affiliateUrl`

- **`ProductOffer.url`** — the clean, canonical destination URL, no tracking
  parameters. This is the real, stable link to the product on the merchant's site.
- **`ProductOffer.affiliateUrl`** — not currently written to automatically; reserved
  for storing a generated affiliate-tagged URL for audit/debugging if that's ever
  needed. Today, the tagged URL is built on the fly by `getAffiliateUrl()` from
  `url` each time `/api/click/...` is hit — `url` is the source of truth, the
  network's affiliate ID is applied at click time.

## How active/inactive works

Two independent flags gate whether an offer is ever shown or redirected to:

```
ProductOffer.active   — this specific offer, on/off
Merchant.active       — the whole merchant relationship, on/off
```

An offer is only ever publicly visible when **both** are `true` — this single rule
(`ACTIVE_OFFER_FILTER` in `src/lib/content/repository.ts`) is applied at every query
that feeds a public page (product pages, comparison pages, the homepage carousel,
guides, best pages) and inside `/api/click/[productId]/[merchantId]`, which now 404s
for an inactive offer or merchant exactly as it does for a nonexistent one — a stale
or shared link to a disabled offer never produces a working redirect.

This is what lets you **stage a real offer before it's approved**: insert the row
with `active: false`, and it's invisible everywhere until you flip it.

## How to add a merchant

`Merchant` is a normal table — add a row via Prisma, same pattern already used for
Amazon/eBay/Etsy/MidwayUSA (see `src/lib/mock-data/merchants.ts` for the shape, or
just run a one-off Prisma `upsert`):

```ts
await prisma.merchant.upsert({
  where: { id: "merchant_opticsplanet" },
  create: {
    id: "merchant_opticsplanet",
    name: "OpticsPlanet",
    slug: "opticsplanet",
    website: "https://www.opticsplanet.com",
    affiliateNetwork: "AWIN", // or AVANTLINK / IMPACT — whichever is real, see below
    affiliateProgram: null,   // network-specific advertiser/program id if the network needs one
    active: true,
  },
  update: {},
});
```

**`affiliateNetwork` must be a real, confirmed value** — never guess which network a
merchant runs through. If you don't know yet, leave the merchant out of the table
until you do, rather than adding it with a guessed network.

If the network isn't implemented as an adapter yet (currently only `AMAZON`, `EBAY`,
`ETSY`, `AWIN` have real adapters — `AVANTLINK`/`IMPACT`/`CJ`/`ENVATO`/`GUMROAD` exist
in the enum but fall back to a plain, non-tagged link via `getAffiliateUrl()`), that's
fine — the offer still works as a plain outbound link, it just won't carry affiliate
tracking until an adapter is written for that network.

## How to add an offer to a product

Use `scripts/add-offer.ts` (mirrors the existing `scripts/set-seo-status.ts`
pattern):

```
npx tsx scripts/add-offer.ts <productId> <merchantId> <url> <price|none> [--msrp] [--inactive]
```

Example (every value here is illustrative — replace with the real ones):

```
npx tsx scripts/add-offer.ts product_vortex_ranger_1300 merchant_opticsplanet \
  "https://www.opticsplanet.com/the-real-product-page" 449.99 --msrp --inactive
```

- Upserts on `(productId, merchantId)` — safe to re-run to update an existing offer.
- `--inactive` stages the offer without making it live (see above) — drop the flag,
  or flip the row's `active` column, once you're ready to go live.
- **`url` must be the real URL a real merchant/network gave you. Never invent, guess,
  or construct one** — including never fabricating a plausible-looking product page
  URL. If you don't have a verified real URL yet, don't add the offer.

## How to disable an offer

```
npx tsx scripts/add-offer.ts <productId> <merchantId> <same-url> <same-price> --inactive
```

(the upsert keeps everything else, just flips `active` to `false`), or a direct
Prisma `update`:

```ts
await prisma.productOffer.update({
  where: { productId_merchantId: { productId, merchantId } },
  data: { active: false },
});
```

Disabling a merchant relationship entirely (e.g. the affiliate program ended) is the
same idea on `Merchant.active` — this immediately hides every offer from that
merchant across the whole site without touching individual `ProductOffer` rows.

## How click tracking works

`/api/click/[productId]/[merchantId]` is the single first-party redirect every
`AffiliateButton` routes through. On each click it:

1. Looks up the `ProductOffer` + `Merchant` by the path params (never trusts a URL
   from the request itself — the redirect destination always comes from the DB row).
2. 404s if either is missing, or either `active` flag is `false`.
3. Builds the outbound URL via `getAffiliateUrl()`.
4. Records a `ClickEvent` (`productId`, `merchantId`, `page`, `placement`, an
   anonymous `sessionId` cookie — no PII, no IP, no identity) — **wrapped in a
   try/catch**, so a tracking-write failure never blocks the redirect.
5. 302s to the merchant.

There is no GA4/third-party analytics pipeline in this project, and this task
deliberately didn't add one — `ClickEvent` already is the click-tracking system
(documented in `MONETIZATION.md` §5 before this change), and building a second,
parallel one would contradict "don't build new infra when something usable already
exists." `category` isn't stored as its own column since it's trivially derivable
by joining `ClickEvent.productId` → `Product.categoryId` when querying stats.

## How to test an affiliate link

1. Add the offer as above (use `--inactive` first if you want to check it renders
   correctly before it's clickable — an inactive offer simply won't appear in
   `WhereToBuy`/the comparison table's "Where to buy" row, which is itself a check).
2. Flip it active (drop `--inactive`, or update the row).
3. Visit the product page and confirm the merchant name + CTA render.
4. Click it (or `curl -I` the `/api/click/<productId>/<merchantId>` URL) and confirm
   a `302` with `Location` pointing at the real merchant URL — with the affiliate tag
   applied if that network's adapter is configured (its env var is set), or the plain
   URL unchanged if not (never a broken/partially-tagged link either way).
5. Confirm a `ClickEvent` row was written for that click.

## Important rule: never invent affiliate URLs

Every `url` in `ProductOffer`, every `id`/`website` in `Merchant`, and every
`affiliateNetwork` value must come from something real — a merchant/network's actual
site or actual approval email. This project's entire content model (see
`DATA_MODEL.md`, `SourceRecord`, the Quality Gate) is built around never presenting
fabricated data as real; affiliate links are no exception. When in doubt, leave the
offer out rather than guess.
