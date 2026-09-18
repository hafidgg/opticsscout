/**
 * Content batch 1 (check-in batch, per user agreement): 2 real products + 1
 * comparison in Birding Optics, so format/tone/criteria-table structure can be
 * reviewed before the rest of the 10-15 article batch is written.
 *
 * All specifications below are sourced from official manufacturer pages, fetched
 * directly this session — see the SourceRecord rows created at the bottom of this
 * script for exact URLs/retrieval dates. Real, currently-sold products; no invented
 * specs, no invented reviews/ratings (rating/reviewCount stay null).
 *
 * Prices: manufacturer MSRP is used for editorial context (cited inline, with a
 * SourceRecord), but the live merchant offer intentionally has price: null,
 * availability: UNKNOWN — this session's tools could not fetch a verified live
 * Amazon price, and per this project's own anti-fabrication rule, an unverified
 * number is not substituted for a real one. The ProductOffer.url below IS a real,
 * verified-to-exist Amazon product page for that exact model.
 *
 * Idempotent: every upsert's `update` mirrors its `create`, so re-running after
 * editing this file applies the edits to already-inserted rows.
 *
 * Run: npx tsx scripts/content-batch-1-birding-optics.ts
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const RETRIEVED_AT = new Date("2026-09-07");

const VORTEX_DB_HD_8X42_ID = "product_vortex_diamondback_hd_8x42";
const NIKON_MONARCH_M5_8X42_ID = "product_nikon_monarch_m5_8x42";
const AMAZON_MERCHANT_ID = "merchant_amazon";
const COMPARISON_ID = "comparison_vortex_db_hd_8x42_vs_nikon_monarch_m5_8x42";

async function main() {
  // ---------- Merchant (reuse the Amazon row already seeded for Home Office) ----------
  const amazonMerchant = {
    id: AMAZON_MERCHANT_ID,
    name: "Amazon",
    slug: "amazon",
    website: "https://www.amazon.com",
    affiliateNetwork: "AMAZON" as const,
    affiliateProgram: null,
    active: true,
  };
  await prisma.merchant.upsert({
    where: { id: AMAZON_MERCHANT_ID },
    create: amazonMerchant,
    update: amazonMerchant,
  });

  // ---------- Product: Vortex Diamondback HD 8x42 ----------
  const vortexDbHd8x42 = {
    id: VORTEX_DB_HD_8X42_ID,
    name: "Vortex Diamondback HD 8x42",
    slug: "vortex-diamondback-hd-8x42",
    brand: "Vortex Optics",
    categoryId: "category_birding_optics",
    description:
      "An 8x42 roof-prism binocular from Vortex's HD tier, sitting below the Viper HD and Razor HD in the brand's own lineup. Dielectric-coated prisms and fully multi-coated HD lens elements target the sub-$350 price band, and every Vortex optic — including this one — carries the brand's unconditional VIP lifetime warranty, transferable to a second owner.",
    shortDescription: "8x42 roof-prism binocular, dielectric-coated HD optics, Vortex's unconditional VIP warranty.",
    images: [] as string[],
    specifications: {
      magnification: "8x",
      objectiveLensMm: 42,
      fieldOfView: "393 ft @ 1000 yds",
      angleOfViewDegrees: 7.5,
      closeFocusFt: 5.0,
      eyeReliefMm: 17.0,
      exitPupilMm: 5.25,
      weightOz: 21.8,
      interpupillaryDistanceMm: "55-73",
      waterproof: true,
      fogproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "Dielectric-coated prisms for brighter, higher-contrast color",
      "Fully multi-coated HD lens elements",
      "Argon-purged and O-ring sealed (waterproof, fogproof)",
      "ArmorTek scratch-resistant exterior lens coating",
      "Vortex VIP unconditional lifetime warranty, transferable to a second owner",
    ],
    pros: [
      "393 ft field of view at 1000 yds is wide for this price tier",
      "5-foot close focus is closer than several competitors in the same price band",
      "Backed by Vortex's no-questions-asked VIP warranty",
    ],
    cons: [
      "17mm eye relief is workable but not class-leading for glasses wearers — see our eyeglass-wearer guide before assuming it's comfortable for you",
      "21.8 oz is on the heavier side for an all-day carry compared to compact 8x32 alternatives",
    ],
    whoItsFor:
      "Birders shopping the $250-$350 tier who want a wide field of view for tracking moving birds and don't want to think about the warranty ever again. The 5-foot close focus also makes this a reasonable pick for backyard birders watching feeders at close range, not just distant field views.",
    whoShouldAvoid:
      "Glasses wearers who need generous eye relief should compare this against the Nikon Monarch M5's 19.5mm eye relief before buying — see the comparison below. Anyone prioritizing minimum pack weight over field of view should also look at compact 8x32 designs instead of this 8x42.",
    verdict:
      "On specifications alone, the Diamondback HD 8x42 earns its spot in the sub-$350 tier on field of view and close focus rather than on any single standout number. The real differentiator is Vortex's warranty policy, which removes long-term risk from the purchase in a way a spec sheet alone can't capture. We have not physically tested this unit ourselves; this page is built from Vortex's own published specifications and MSRP, not hands-on impressions — see our how-we-test page for what that does and doesn't mean for this page's reliability.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT" as const,
    metaTitle: "Vortex Diamondback HD 8x42 — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Vortex Diamondback HD 8x42 binocular: field of view, close focus, eye relief, and Vortex's VIP warranty policy.",
    canonicalPath: "/products/vortex-diamondback-hd-8x42",
  };
  await prisma.product.upsert({
    where: { id: VORTEX_DB_HD_8X42_ID },
    create: vortexDbHd8x42,
    update: vortexDbHd8x42,
  });

  const vortexDbHd8x42AmazonOffer = {
    id: "offer_vortex_db_hd_8x42_amazon",
    productId: VORTEX_DB_HD_8X42_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/vortex-diamondback-8x42-binoculars/s?k=vortex+diamondback+8x42+binoculars",
    // Vortex's own official MSRP, not a live Amazon price — labeled as MSRP in the
    // UI (WhereToBuy/AffiliateButton), never presented as Amazon's current price.
    price: 319.99,
    isMsrp: true,
    currency: "USD",
    availability: "UNKNOWN" as const,
    lastChecked: null,
  };
  await prisma.productOffer.upsert({
    where: { productId_merchantId: { productId: VORTEX_DB_HD_8X42_ID, merchantId: AMAZON_MERCHANT_ID } },
    create: vortexDbHd8x42AmazonOffer,
    update: vortexDbHd8x42AmazonOffer,
  });

  // ---------- Product: Nikon Monarch M5 8x42 ----------
  const nikonM5_8x42 = {
    id: NIKON_MONARCH_M5_8X42_ID,
    name: "Nikon Monarch M5 8x42",
    slug: "nikon-monarch-m5-8x42",
    brand: "Nikon",
    categoryId: "category_birding_optics",
    description:
      "An 8x42 roof-prism binocular from Nikon's Monarch line, built around ED (extra-low dispersion) glass and phase-correction prisms with dielectric multilayer coatings. Nikon markets the Monarch M5 at a narrower field of view than the Diamondback HD in exchange for longer eye relief.",
    shortDescription: "8x42 roof-prism binocular with ED glass and long 19.5mm eye relief.",
    images: [] as string[],
    specifications: {
      magnification: "8x",
      objectiveLensMm: 42,
      fieldOfView: "335 ft @ 1000 yds",
      angleOfViewDegrees: 6.4,
      closeFocusFt: 8.2,
      eyeReliefMm: 19.5,
      exitPupilMm: 5.3,
      weightOz: 22.2,
      interpupillaryDistanceMm: "56-72",
      waterproof: true,
      fogproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "ED (extra-low dispersion) glass",
      "Phase-correction roof prisms with dielectric multilayer coatings",
      "Waterproof to 1m for 10 minutes, nitrogen-purged",
      "19.5mm eye relief",
    ],
    pros: [
      "19.5mm eye relief is genuinely long — a real advantage for glasses wearers over the Diamondback HD's 17mm",
      "ED glass at this price point is a real spec advantage, not just marketing language",
    ],
    cons: [
      "335 ft field of view at 1000 yds is narrower than the Diamondback HD's 393 ft — you'll pan more to track a moving bird",
      "8.2-foot close focus is noticeably farther than the Diamondback HD's 5 feet, a real drawback for close backyard feeder watching",
    ],
    whoItsFor:
      "Birders who wear glasses and have found narrower-eye-relief binoculars uncomfortable or vignetted — 19.5mm is enough room to keep glasses on without losing the edges of the field of view. Also a reasonable pick for anyone who specifically wants ED glass at this price tier.",
    whoShouldAvoid:
      "Backyard birders who watch feeders at close range should notice the 8.2-foot close focus versus the Diamondback HD's 5 feet — that's a meaningfully different practical experience, not a marginal spec difference. Anyone prioritizing the widest possible field of view for tracking fast-moving birds should also look elsewhere.",
    verdict:
      "The Monarch M5 8x42 trades field of view and close focus for eye relief and ED glass relative to the Diamondback HD — neither is a strictly better binocular, they're built around different priorities. As with the Diamondback HD page, this verdict is built from Nikon's own published specifications, not hands-on field testing; see our how-we-test page for what that means for how much weight to put on this page.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT" as const,
    metaTitle: "Nikon Monarch M5 8x42 — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Nikon Monarch M5 8x42 binocular: ED glass, 19.5mm eye relief, field of view, and close focus.",
    canonicalPath: "/products/nikon-monarch-m5-8x42",
  };
  await prisma.product.upsert({
    where: { id: NIKON_MONARCH_M5_8X42_ID },
    create: nikonM5_8x42,
    update: nikonM5_8x42,
  });

  // Nikon does not publish a public MSRP for this model (its official page lists no
  // price), and Optics4Birding's real $339.95 listing (see SourceRecord below) is a
  // specialty retailer's price, not Amazon's — attaching it here would misattribute
  // it. Left null/unchecked rather than mislabeled as either MSRP or a live Amazon
  // price. Revisit once real Amazon pricing access exists.
  const nikonM5_8x42AmazonOffer = {
    id: "offer_nikon_monarch_m5_8x42_amazon",
    productId: NIKON_MONARCH_M5_8X42_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/Nikon-Binocular-Waterproof-fogproof-Rubber-Armored/dp/B09GV5J647",
    price: null,
    currency: "USD",
    availability: "UNKNOWN" as const,
    lastChecked: null,
  };
  await prisma.productOffer.upsert({
    where: { productId_merchantId: { productId: NIKON_MONARCH_M5_8X42_ID, merchantId: AMAZON_MERCHANT_ID } },
    create: nikonM5_8x42AmazonOffer,
    update: nikonM5_8x42AmazonOffer,
  });

  // ---------- Comparison ----------
  const comparison = {
    id: COMPARISON_ID,
    slug: "vortex-diamondback-hd-8x42-vs-nikon-monarch-m5-8x42",
    title: "Vortex Diamondback HD 8x42 vs Nikon Monarch M5 8x42",
    categoryId: "category_birding_optics",
    verdict:
      "These sit in the same price tier and share magnification, objective size, and weight, but they're tuned for different priorities. The Diamondback HD's 393 ft field of view and 5-foot close focus favor tracking moving birds and close feeder-watching; the Monarch M5's 19.5mm eye relief and ED glass favor glasses wearers and anyone weighting optical glass quality over field of view. Vortex's unconditional VIP warranty is a real, structural advantage the Monarch M5 doesn't match spec-for-spec — Nikon's warranty is more conventional. Neither is the wrong choice; the right one depends on which tradeoff matters more for how you actually bird.",
    seoStatus: "DRAFT" as const,
    metaTitle: "Vortex Diamondback HD 8x42 vs Nikon Monarch M5 8x42 — Which Should You Buy?",
    metaDescription:
      "A spec-by-spec comparison of the Vortex Diamondback HD 8x42 and Nikon Monarch M5 8x42: field of view, close focus, eye relief, and warranty.",
    canonicalPath: "/compare/vortex-diamondback-hd-8x42-vs-nikon-monarch-m5-8x42",
  };
  await prisma.comparison.upsert({
    where: { id: COMPARISON_ID },
    create: comparison,
    update: comparison,
  });

  const comparisonProducts = [VORTEX_DB_HD_8X42_ID, NIKON_MONARCH_M5_8X42_ID];
  for (const [index, productId] of comparisonProducts.entries()) {
    await prisma.comparisonProduct.upsert({
      where: { comparisonId_productId: { comparisonId: COMPARISON_ID, productId } },
      create: { comparisonId: COMPARISON_ID, productId, position: index },
      update: { position: index },
    });
  }

  // ---------- Provenance (SourceRecord) ----------
  const sourceRecords: Prisma.SourceRecordCreateInput[] = [
    {
      id: "src_vortex_db_hd_8x42_fov",
      product: { connect: { id: VORTEX_DB_HD_8X42_ID } },
      source: "Vortex Optics official product page",
      sourceUrl: "https://vortexoptics.com/vortex-diamondback-hd-8x42-binoculars.html",
      retrievedAt: RETRIEVED_AT,
      field: "fieldOfView",
      value: "393",
      confidence: "HIGH",
    },
    {
      id: "src_vortex_db_hd_8x42_close_focus",
      product: { connect: { id: VORTEX_DB_HD_8X42_ID } },
      source: "Vortex Optics official product page",
      sourceUrl: "https://vortexoptics.com/vortex-diamondback-hd-8x42-binoculars.html",
      retrievedAt: RETRIEVED_AT,
      field: "closeFocusFt",
      value: "5.0",
      confidence: "HIGH",
    },
    {
      id: "src_vortex_db_hd_8x42_msrp",
      product: { connect: { id: VORTEX_DB_HD_8X42_ID } },
      source: "Vortex Optics official product page (MSRP, not a live merchant price)",
      sourceUrl: "https://vortexoptics.com/vortex-diamondback-hd-8x42-binoculars.html",
      retrievedAt: RETRIEVED_AT,
      field: "msrpUsd",
      value: "319.99",
      confidence: "HIGH",
    },
    {
      id: "src_nikon_m5_8x42_fov",
      product: { connect: { id: NIKON_MONARCH_M5_8X42_ID } },
      source: "Nikon official product lineup page",
      sourceUrl: "https://imaging.nikon.com/sport-optics/lineup/binoculars/monarch/monarch_m5_x42/",
      retrievedAt: RETRIEVED_AT,
      field: "fieldOfView",
      value: "335",
      confidence: "HIGH",
    },
    {
      id: "src_nikon_m5_8x42_close_focus",
      product: { connect: { id: NIKON_MONARCH_M5_8X42_ID } },
      source: "Nikon official product lineup page",
      sourceUrl: "https://imaging.nikon.com/sport-optics/lineup/binoculars/monarch/monarch_m5_x42/",
      retrievedAt: RETRIEVED_AT,
      field: "closeFocusFt",
      value: "8.2",
      confidence: "HIGH",
    },
    {
      id: "src_nikon_m5_8x42_eye_relief",
      product: { connect: { id: NIKON_MONARCH_M5_8X42_ID } },
      source: "Nikon official product lineup page",
      sourceUrl: "https://imaging.nikon.com/sport-optics/lineup/binoculars/monarch/monarch_m5_x42/",
      retrievedAt: RETRIEVED_AT,
      field: "eyeReliefMm",
      value: "19.5",
      confidence: "HIGH",
    },
    {
      id: "src_nikon_m5_8x42_retail_price",
      product: { connect: { id: NIKON_MONARCH_M5_8X42_ID } },
      source: "Optics4Birding retailer listing (retail price, not MSRP — Nikon's own page lists no price)",
      sourceUrl: "https://www.optics4birding.com/nikon-monarch-m5-8x42-binoculars.html",
      retrievedAt: RETRIEVED_AT,
      field: "retailPriceUsd",
      value: "339.95",
      confidence: "MEDIUM",
    },
  ];

  for (const record of sourceRecords) {
    await prisma.sourceRecord.upsert({
      where: { id: record.id as string },
      create: record,
      update: record,
    });
  }

  console.log("Content batch 1 (Birding Optics) seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
