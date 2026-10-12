/**
 * Content batch 7: two 10x42 binoculars (DRAFT) + the "8x42 vs 10x42" Guide (DRAFT).
 *
 * Products — specs from the manufacturers' official product pages only, retrieved
 * 2026-10-12 (user-reviewed research table):
 * - Vortex Diamondback HD 10x42 (SKU DB-215, same series page family as the 8x42's
 *   DB-214): https://vortexoptics.com/vortex-diamondback-hd-10x42-binocular.html
 *   MSRP $329.99 is recorded in its SourceRecord only — see "No ProductOffer" below.
 *   Per user decision (2026-10-12) it is NOT shown in the guide copy either, so the
 *   page never states a price that the product card (no offer -> "No verified price")
 *   can't back up.
 *   Exit pupil isn't published on that page and is deliberately omitted.
 *   Warranty: "VIP ... Unlimited. Unconditional. Lifetime Warranty." — the word
 *   "transferable" is deliberately NOT used (not on the current official page).
 * - Nikon Monarch M5 10x42: same official page as the 8x42 (shared MONARCH M5
 *   8x42/10x42/12x42 spec table):
 *   https://imaging.nikon.com/sport-optics/lineup/binoculars/monarch/monarch_m5_x42/
 *   No price and no warranty on that page; none recorded.
 *
 * No ProductOffer rows are created (no search links, no invented ASINs). The product
 * pages show "No merchant offers available yet for this product." and no price.
 *
 * Guide — scoped to these four products (8x42 and 10x42 from Vortex and Nikon), built
 * only from DB numbers. No general claims beyond the specs (e.g. hand steadiness,
 * low-light brightness) — those were left out per the user's rule.
 *
 * Everything is created as seoStatus: DRAFT. Promotion is a separate, explicit step.
 * Content pages are static: promote BEFORE the deploy that should publish them, or push
 * an empty rebuild commit afterwards (docs/CONTENT_WORKFLOW.md). The guide links to the
 * two new product pages, so those must be promoted together with the guide.
 *
 * Idempotent: every upsert's `update` mirrors its `create`, except seoStatus, which
 * is create-only (see withoutSeoStatus below) so a re-run never changes indexability.
 *
 * Run: npx tsx scripts/content-batch-7-10x42-binoculars-and-guide.ts
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

// seoStatus is written on CREATE only — a brand-new row starts as DRAFT — and is
// deliberately stripped from every UPDATE. Promotion to INDEXABLE is a separate,
// explicit step (scripts/set-seo-status.ts); re-running this script later (e.g. to
// fix a typo) must never silently demote a live, indexed page back to DRAFT. Do not
// "simplify" this back to `update: data`. See docs/CONTENT_WORKFLOW.md.
function withoutSeoStatus<T extends { seoStatus?: unknown }>(data: T): Omit<T, "seoStatus"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { seoStatus, ...rest } = data;
  return rest;
}

const RETRIEVED_AT = new Date("2026-10-12");
const VORTEX_URL = "https://vortexoptics.com/vortex-diamondback-hd-10x42-binocular.html";
const NIKON_URL =
  "https://imaging.nikon.com/sport-optics/lineup/binoculars/monarch/monarch_m5_x42/";

const VORTEX_8X42_ID = "product_vortex_diamondback_hd_8x42";
const NIKON_8X42_ID = "product_nikon_monarch_m5_8x42";
const VORTEX_10X42_ID = "product_vortex_diamondback_hd_10x42";
const NIKON_10X42_ID = "product_nikon_monarch_m5_10x42";
const GUIDE_ID = "guide_8x42_vs_10x42_binoculars";

const vortex10x42: Prisma.ProductUncheckedCreateInput & { id: string } = {
  id: VORTEX_10X42_ID,
  name: "Vortex Diamondback HD 10x42",
  slug: "vortex-diamondback-hd-10x42",
  brand: "Vortex Optics",
  categoryId: "category_birding_optics",
  description:
    "The 10x42 version of Vortex's Diamondback HD roof-prism binocular, the same series as the Diamondback HD 8x42. Per Vortex's published specifications it has a 330 ft field of view at 1,000 yards, 5.0 ft close focus, 15.0 mm eye relief, and weighs 21.3 oz. It's listed as waterproof and fogproof and is covered by Vortex's VIP warranty.",
  shortDescription: "10x42 roof-prism binocular from Vortex's Diamondback HD series, VIP warranty.",
  images: [],
  specifications: {
    magnification: "10x",
    objectiveLensMm: 42,
    fieldOfView: "330 ft @ 1000 yds",
    angleOfViewDegrees: 6.3,
    closeFocusFt: 5.0,
    eyeReliefMm: 15.0,
    weightOz: 21.3,
    interpupillaryDistanceMm: "55-73",
    waterproof: true,
    fogproof: true,
  } satisfies Prisma.InputJsonValue,
  features: [
    "Waterproof and fogproof (per Vortex)",
    "Shockproof (per Vortex)",
    "Tripod adaptable (per Vortex)",
    "Vortex VIP warranty: unlimited, unconditional, lifetime",
  ],
  pros: [
    "Same 5.0 ft close focus as the Diamondback HD 8x42",
    "21.3 oz, 0.5 oz lighter than the Diamondback HD 8x42",
    "Covered by Vortex's VIP unconditional lifetime warranty",
  ],
  cons: [
    "330 ft field of view at 1,000 yards, versus 393 ft for the Diamondback HD 8x42",
    "15.0 mm eye relief, versus 17.0 mm for the Diamondback HD 8x42",
  ],
  whoItsFor:
    "Buyers choosing within the Diamondback HD series who want 10x magnification instead of 8x and accept the narrower published field of view (330 ft vs 393 ft at 1,000 yards) and shorter eye relief (15.0 mm vs 17.0 mm) that come with it on these two models.",
  whoShouldAvoid:
    "Anyone for whom field of view or eye relief is the priority should compare this against the Diamondback HD 8x42, which has 393 ft and 17.0 mm on Vortex's published specs.",
  verdict:
    "On Vortex's published specs, the 10x42 trades 63 ft of field of view at 1,000 yards and 2 mm of eye relief for 10x instead of 8x magnification, with the same close focus and nearly the same weight as the 8x42. We have not field-tested it; this page is built from Vortex's published specifications only. No retailer offer is listed yet.",
  rating: null,
  reviewCount: null,
  seoStatus: "DRAFT",
  metaTitle: "Vortex Diamondback HD 10x42 — Specs and Who It's For",
  metaDescription:
    "A spec-driven look at the Vortex Diamondback HD 10x42 binocular: field of view, close focus, eye relief, weight, and how it compares with the 8x42.",
  canonicalPath: "/products/vortex-diamondback-hd-10x42",
};

const nikon10x42: Prisma.ProductUncheckedCreateInput & { id: string } = {
  id: NIKON_10X42_ID,
  name: "Nikon Monarch M5 10x42",
  slug: "nikon-monarch-m5-10x42",
  brand: "Nikon",
  categoryId: "category_birding_optics",
  description:
    "The 10x42 version of Nikon's Monarch M5 roof-prism binocular, listed on the same Nikon spec page as the Monarch M5 8x42. Per Nikon's published specifications it has a 293 ft field of view at 1,000 yards, 8.2 ft close focus, 18.4 mm eye relief, a 4.2 mm exit pupil, and weighs 22.6 oz. Nikon lists it as waterproof to 1 m for 10 minutes and fog-free with O-ring seals and nitrogen gas.",
  shortDescription: "10x42 roof-prism binocular from Nikon's Monarch M5 line, 18.4 mm eye relief.",
  images: [],
  specifications: {
    magnification: "10x",
    objectiveLensMm: 42,
    fieldOfView: "293 ft @ 1000 yds",
    angleOfViewDegrees: 5.6,
    closeFocusFt: 8.2,
    eyeReliefMm: 18.4,
    exitPupilMm: 4.2,
    weightOz: 22.6,
    interpupillaryDistanceMm: "56-72",
    waterproof: true,
    fogproof: true,
  } satisfies Prisma.InputJsonValue,
  features: [
    "ED (extra-low dispersion) glass (per Nikon, Monarch M5 line)",
    "Dielectric high-reflective multilayer prism coating (per Nikon, Monarch M5 line)",
    "Waterproof to 1 m for 10 minutes, fog-free with O-ring seals and nitrogen gas",
    "18.4 mm eye relief",
  ],
  pros: [
    "18.4 mm eye relief, the longest of the two 10x42s we have on file",
    "Same 8.2 ft close focus as the Monarch M5 8x42",
  ],
  cons: [
    "293 ft field of view at 1,000 yards, versus 335 ft for the Monarch M5 8x42",
  ],
  whoItsFor:
    "Buyers choosing within the Monarch M5 line who want 10x magnification instead of 8x and accept the narrower published field of view (293 ft vs 335 ft at 1,000 yards) that comes with it on these two models.",
  whoShouldAvoid:
    "Anyone for whom field of view is the priority should compare this against the Monarch M5 8x42, which has 335 ft on Nikon's published specs.",
  verdict:
    "On Nikon's published specs, the 10x42 trades 42 ft of field of view at 1,000 yards, 1.1 mm of eye relief, and 1.1 mm of exit pupil for 10x instead of 8x magnification, with the same close focus and a 0.4 oz heavier body. We have not field-tested it; this page is built from Nikon's published specifications only. No price or retailer offer is on file yet.",
  rating: null,
  reviewCount: null,
  seoStatus: "DRAFT",
  metaTitle: "Nikon Monarch M5 10x42 — Specs and Who It's For",
  metaDescription:
    "A spec-driven look at the Nikon Monarch M5 10x42 binocular: field of view, close focus, eye relief, exit pupil, and how it compares with the 8x42.",
  canonicalPath: "/products/nikon-monarch-m5-10x42",
};

const sourceRecords: Prisma.SourceRecordUncheckedCreateInput[] = [
  {
    id: "src_vortex_db_hd_10x42_specs",
    productId: VORTEX_10X42_ID,
    source: "manufacturer product page (spec table)",
    sourceUrl: VORTEX_URL,
    retrievedAt: RETRIEVED_AT,
    field:
      "magnification, objectiveLensMm, fieldOfView, angleOfViewDegrees, closeFocusFt, eyeReliefMm, weightOz, interpupillaryDistanceMm, waterproof, fogproof",
    value:
      "10x; 42 mm; 330 ft @ 1000 yds; 6.3 deg; 5.0 ft; 15.0 mm; 21.3 oz; 55-73 mm; waterproof; fogproof (SKU DB-215)",
    confidence: "HIGH",
  },
  {
    id: "src_vortex_db_hd_10x42_msrp",
    productId: VORTEX_10X42_ID,
    source: "manufacturer product page (price shown beside 'MSRP')",
    sourceUrl: VORTEX_URL,
    retrievedAt: RETRIEVED_AT,
    field: "msrpUsd",
    value: "$329.99",
    confidence: "HIGH",
  },
  {
    id: "src_vortex_db_hd_10x42_warranty",
    productId: VORTEX_10X42_ID,
    source: "manufacturer product page",
    sourceUrl: VORTEX_URL,
    retrievedAt: RETRIEVED_AT,
    field: "warranty",
    value: "VIP Warranty: Unlimited. Unconditional. Lifetime Warranty.",
    confidence: "HIGH",
  },
  {
    id: "src_nikon_monarch_m5_10x42_specs",
    productId: NIKON_10X42_ID,
    source: "manufacturer product page (MONARCH M5 8x42/10x42/12x42 spec table)",
    sourceUrl: NIKON_URL,
    retrievedAt: RETRIEVED_AT,
    field:
      "magnification, objectiveLensMm, fieldOfView, angleOfViewDegrees, closeFocusFt, eyeReliefMm, exitPupilMm, weightOz, interpupillaryDistanceMm",
    value: "10x; 42 mm; 98 m / 293 ft @ 1000 m/yd; 5.6 deg (real); 2.5 m / 8.2 ft; 18.4 mm; 4.2 mm; 640 g / 22.6 oz; 56-72 mm",
    confidence: "HIGH",
  },
  {
    id: "src_nikon_monarch_m5_10x42_weather",
    productId: NIKON_10X42_ID,
    source: "manufacturer product page (key features, Monarch M5 line)",
    sourceUrl: NIKON_URL,
    retrievedAt: RETRIEVED_AT,
    field: "waterproof, fogproof",
    value:
      "Waterproof (up to 1m/3.3 ft. for 10 minutes) and fog-free with O-ring seals and nitrogen gas",
    confidence: "HIGH",
  },
];

const CONTENT = `This guide compares the four binoculars we have on file in these two magnifications: the Vortex Diamondback HD in 8x42 and 10x42, and the Nikon Monarch M5 in 8x42 and 10x42. It's a comparison of these four models specifically, not of every 8x42 or 10x42 binocular. Because each brand offers both versions, you can see what changes when only the magnification changes. All figures are the manufacturers' published specifications.

## Magnification

The 10x42s magnify 10x and the 8x42s magnify 8x, so the 10x versions make subjects appear 25% larger. All four have 42 mm objective lenses.

## Field of view

Field of view is how wide an area you see at a given distance. On both brands, the 10x version shows a narrower area:

- Vortex Diamondback HD: 393 ft at 1,000 yards (8x42) vs 330 ft (10x42), about 16% narrower
- Nikon Monarch M5: 335 ft at 1,000 yards (8x42) vs 293 ft (10x42), about 12.5% narrower

## Eye relief

Eye relief is the distance from the eyepiece at which you can see the full image. It's shorter on both 10x versions:

- Vortex Diamondback HD: 17.0 mm (8x42) vs 15.0 mm (10x42)
- Nikon Monarch M5: 19.5 mm (8x42) vs 18.4 mm (10x42)

## Exit pupil

Exit pupil is the diameter of the beam of light leaving the eyepiece. Nikon publishes it for both versions: 5.3 mm (8x42) vs 4.2 mm (10x42). Vortex doesn't list exit pupil on its product pages, so we can't compare the Vortex pair on this.

## What stays the same

- Close focus: unchanged within each brand. 5.0 ft for both Vortex models, 8.2 ft for both Nikon models.
- Weight: nearly unchanged. Vortex 21.8 oz (8x42) vs 21.3 oz (10x42); Nikon 22.2 oz (8x42) vs 22.6 oz (10x42).
- Weather sealing: all four are listed as waterproof and fogproof.

## Price (MSRP) and warranty

- Vortex Diamondback HD 8x42: $319.99 MSRP
- Vortex Diamondback HD 10x42: no verified price on file
- Nikon Monarch M5 8x42 and 10x42: no verified price on file

The one price shown is a manufacturer's suggested retail price, not a live retailer price. Both Vortex models are covered by Vortex's VIP unconditional lifetime warranty. We don't have Nikon's warranty terms on file.

## Which fits which priority

On these four models' specs: choose the 8x42 version if field of view or eye relief matters most, since it's wider and has longer eye relief on both brands. Choose the 10x42 version if magnification is the priority. Close focus and weight are not a reason to choose either, since they're the same or nearly the same within each brand.

## Going deeper

- The 8x42s head to head: [Vortex Diamondback HD 8x42 vs Nikon Monarch M5 8x42](/compare/vortex-diamondback-hd-8x42-vs-nikon-monarch-m5-8x42)
- Product details: [Vortex Diamondback HD 8x42](/products/vortex-diamondback-hd-8x42), [Vortex Diamondback HD 10x42](/products/vortex-diamondback-hd-10x42), [Nikon Monarch M5 8x42](/products/nikon-monarch-m5-8x42), [Nikon Monarch M5 10x42](/products/nikon-monarch-m5-10x42)
- Browse: [Birding Optics](/categories/birding-optics)

None of these binoculars has been field-tested here; this guide is built from manufacturer-published specifications and MSRP.`;

const guide: Prisma.GuideUncheckedCreateInput = {
  id: GUIDE_ID,
  slug: "8x42-vs-10x42-binoculars",
  title: "8x42 vs 10x42 Binoculars: What Changes on the Same Models",
  intent: "8x42 vs 10x42 binoculars",
  content: CONTENT,
  categoryId: "category_birding_optics",
  seoStatus: "DRAFT",
  metaTitle: "8x42 vs 10x42 Binoculars: Same Models Compared",
  metaDescription:
    "Vortex Diamondback HD and Nikon Monarch M5 in 8x42 and 10x42, compared on published specs: field of view, eye relief, exit pupil, close focus, weight, MSRP.",
  canonicalPath: "/guides/8x42-vs-10x42-binoculars",
};

async function main() {
  for (const product of [vortex10x42, nikon10x42]) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: product,
      update: withoutSeoStatus(product),
    });
  }

  for (const record of sourceRecords) {
    await prisma.sourceRecord.upsert({
      where: { id: record.id as string },
      create: record,
      update: record,
    });
  }

  await prisma.guide.upsert({
    where: { id: GUIDE_ID },
    create: guide,
    update: withoutSeoStatus(guide),
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: VORTEX_8X42_ID, position: 0 },
    { productId: VORTEX_10X42_ID, position: 1 },
    { productId: NIKON_8X42_ID, position: 2 },
    { productId: NIKON_10X42_ID, position: 3 },
  ];
  for (const entry of entries) {
    await prisma.guideProduct.upsert({
      where: { guideId_productId: { guideId: GUIDE_ID, productId: entry.productId } },
      create: { guideId: GUIDE_ID, ...entry },
      update: entry,
    });
  }

  console.log(
    `Products ${VORTEX_10X42_ID}, ${NIKON_10X42_ID}, ${sourceRecords.length} SourceRecords, and Guide ${GUIDE_ID} (${entries.length} products) upserted (seoStatus: DRAFT if new, otherwise unchanged).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
