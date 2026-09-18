# MONETIZATION.md

## 1. Niche Justification (Section 36 requirement)

**Selected: Home Office & Ergonomic Workspace Gear.** Full reasoning in PROJECT_PLAN.md
§3. Short version: it is the rare category with genuine presence across all three initial
affiliate ecosystems (Amazon, eBay, Etsy), evergreen non-seasonal demand, mid-range ticket
size ($50–$800), comparison-native search intent, and no YMYL/AdSense-restriction risk —
unlike higher-competition alternatives (consumer electronics, health/wellness, fashion)
that were considered and rejected.

## 2. Revenue Streams

1. **Affiliate commissions** — Amazon Associates, eBay Partner Network, Etsy Affiliates,
   Awin, at MVP. Impact/CJ/Envato/Gumroad are architected for (via the `AffiliateNetwork`
   enum and adapter interface) but not implemented until there's a concrete product fit
   for them in this niche (Section 1: "potential later integrations").
2. **Display advertising** — Google AdSense, once the site has enough indexed,
   quality-gated content to plausibly qualify for approval. Ad slots are reserved in the
   layout from day one so activation doesn't require a redesign.
3. **Sponsored/commercial partnerships** — explicitly deferred; no infrastructure is
   built for this until real demand exists (Section 1: "eventually...if appropriate").

## 3. Affiliate Architecture

- Centralized `getAffiliateUrl(offer)` in `lib/affiliate/index.ts`. No component or route
  constructs an affiliate URL by hand.
- Per-merchant adapters (`AmazonAdapter`, `EbayAdapter`, `EtsyAdapter`, `AwinAdapter`)
  implement one shared `MerchantAdapter` interface (see ARCHITECTURE.md §3).
- Affiliate IDs are read from environment variables only:
  - `AMAZON_ASSOCIATE_TAG`
  - `EBAY_CAMPAIGN_ID`
  - `ETSY_AFFILIATE_ID`
  - `AWIN_PUBLISHER_ID`
- **None of these are assumed to exist.** Each adapter's `isConfigured()` returns `false`
  when its env var is unset, and the app falls back to the plain destination URL rather
  than emitting a broken affiliate link or throwing. This keeps local dev and any future
  contributor's environment fully functional with zero credentials.
- Affiliate links are never embedded as raw `<a href>` — they're rendered through an
  `AffiliateButton` component that routes through the first-party click-tracking redirect
  (`/api/click/[productId]/[merchantId]`), which then does the actual 302 to the
  affiliate URL. This is what makes click tracking (Section 18) and disclosure (Section 3
  below) consistent everywhere.

## 4. Disclosure

- `components/affiliate/AffiliateDisclosure.tsx` — a reusable, honest disclosure snippet
  ("This page may contain affiliate links. If you purchase through one, we may earn a
  commission at no extra cost to you.") rendered near affiliate CTAs on product/
  comparison/best pages.
- `/affiliate-disclosure` — the full, site-wide policy page (route already scaffolded per
  Section 6 IA).
- Disclosure is never hidden behind a click or placed below the fold on pages with
  affiliate CTAs above it.

## 5. Click Tracking

Per-click record: `productId`, `merchantId`, `page`, `placement`, anonymous `sessionId`,
`createdAt`. No IP address, user-agent, or identity is stored (Section 18/19). This feeds:

- Top clicked products/categories
- Outbound CTR per page/placement
- Which merchant a given product converts through most (informational — no conversion
  $ data exists until/unless a network's postback or reporting API is integrated, which
  is `NOT_IMPLEMENTED` and would be labeled `BLOCKED — EXTERNAL CREDENTIAL REQUIRED` until
  real API access exists).

## 6. AdSense UX Strategy

Reserved, fixed-size ad slots (to protect CLS) at:
- Below the homepage hero, above "how the platform works"
- Mid-content on `/best` and `/compare` pages (after the top 2–3 picks, before deeper
  comparison detail)
- Sidebar on desktop only for `/guides` and `/products` pages
- End-of-content on all long-form pages

Placeholders render a neutral "Ad space reserved" box in development; real AdSense script
integration is a documented Phase 3+ step gated on actual AdSense approval — this is
`BLOCKED — EXTERNAL CREDENTIAL REQUIRED` (AdSense publisher ID) until you have an account.

## 7. Privacy Considerations

- Click tracking is anonymous/session-scoped, no cross-session identity linkage planned.
- No email capture, no user accounts at MVP — nothing that would require a privacy-policy
  section beyond disclosing analytics/ad cookies and affiliate tracking, which
  `/privacy` will state plainly (real content to be filled in with your actual business
  details — placeholders only, per Section 34's explicit prohibition on fake legal
  identities).

## 8. Status

`NOT_IMPLEMENTED` — adapters, click route, and disclosure component are designed here and
scheduled in TODO.md Phase 1; not yet coded as of this document's writing (see TODO.md for
current progress at any point in time).
