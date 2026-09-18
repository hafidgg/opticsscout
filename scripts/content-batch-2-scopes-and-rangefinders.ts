/**
 * Content batch 2: 4 real products + 2 comparisons — 2 in Spotting Scopes, 2 in
 * Rangefinders — continuing the same sourcing standard as content-batch-1:
 * specs from official manufacturer pages (SourceRecord rows at the bottom cite
 * exact URLs/dates), MSRP shown but explicitly labeled via isMsrp (never
 * disguised as a live merchant price), no fabricated ratings.
 *
 * Note on the Vortex Ranger 1300's accuracy spec: the official Vortex page's
 * own accuracy field extracted ambiguously ("< 1000"); the clean "±3 yds @ 1000
 * yds" figure used here is corroborated across multiple secondary retailer/dealer
 * pages citing the same official spec, but is not a verbatim quote from Vortex's
 * own page text the way the other specs are — SourceRecord confidence is MEDIUM
 * for that one field specifically, HIGH for everything else on this product.
 *
 * Idempotent: every upsert's `update` mirrors its `create`.
 *
 * Run: npx tsx scripts/content-batch-2-scopes-and-rangefinders.ts
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const RETRIEVED_AT = new Date("2026-09-07");
const AMAZON_MERCHANT_ID = "merchant_amazon";

const VORTEX_SCOPE_ID = "product_vortex_diamondback_hd_20_60x85";
const CELESTRON_SCOPE_ID = "product_celestron_regal_m2_20_60x80ed";
const SCOPE_COMPARISON_ID = "comparison_vortex_db_hd_scope_vs_celestron_regal_m2";

const VORTEX_RANGEFINDER_ID = "product_vortex_ranger_1300";
const LEUPOLD_RANGEFINDER_ID = "product_leupold_rx_1400i_tbrw_gen2";
const RANGEFINDER_COMPARISON_ID = "comparison_vortex_ranger_1300_vs_leupold_rx_1400i";

async function upsertProduct(data: Prisma.ProductUncheckedCreateInput & { id: string }) {
  await prisma.product.upsert({ where: { id: data.id }, create: data, update: data });
}

async function upsertOffer(
  data: Prisma.ProductOfferUncheckedCreateInput & { id: string }
) {
  await prisma.productOffer.upsert({
    where: { productId_merchantId: { productId: data.productId, merchantId: data.merchantId } },
    create: data,
    update: data,
  });
}

async function main() {
  // ================= Spotting Scopes =================

  await upsertProduct({
    id: VORTEX_SCOPE_ID,
    name: "Vortex Diamondback HD 20-60x85 (Angled)",
    slug: "vortex-diamondback-hd-20-60x85-angled",
    brand: "Vortex Optics",
    categoryId: "category_spotting_scopes",
    description:
      "A 20-60x85 angled spotting scope from Vortex's HD tier — the full-size objective option in the Diamondback HD line (a compact 16-48x65 also exists at a lower price). HD optical elements, multiple anti-reflective coatings, and a built-in sunshade target long-distance field use; like every Vortex optic, it carries the brand's unconditional VIP lifetime warranty.",
    shortDescription: "20-60x85 angled spotting scope, HD optics, built-in sunshade, Vortex VIP warranty.",
    images: [],
    specifications: {
      magnification: "20-60x",
      objectiveLensMm: 85,
      fieldOfView: "108-60 ft @ 1000 yds",
      angleOfView: "2.1-1.1 degrees",
      closeFocusFt: 24.6,
      eyeReliefMm: "18.3-20.3",
      weightOz: 60.9,
      lengthIn: 16.0,
      waterproof: true,
      fogproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "HD optical system with multiple anti-reflective coatings",
      "Built-in sunshade (glare and light rain/snow protection for the objective lens)",
      "Arca-Swiss compatible, tripod adaptable",
      "Vortex VIP unconditional lifetime warranty",
    ],
    pros: [
      "85mm objective gathers more light than the compact 65mm Diamondback HD variant — a real advantage in low light",
      "Built-in sunshade is a genuine field-use convenience, not just a spec-sheet feature",
    ],
    cons: [
      "60.9 oz is heavy for anything but tripod use — this is not a scope you hand-hold for long",
      "24.6 ft close focus means it's not useful for anything nearby; it's built for distance",
    ],
    whoItsFor:
      "Birders and long-distance observers who already accept a tripod is part of the setup and want the widest possible light gathering at range. The 20-60x zoom range covers both a wider initial view for finding a target and higher power for confirming identification at distance.",
    whoShouldAvoid:
      "Anyone wanting a scope light enough to carry hand-held or in a daypack without a dedicated tripod should look at the compact 16-48x65 Diamondback HD instead, or reconsider whether a spotting scope is the right tool versus a higher-magnification binocular.",
    verdict:
      "The 85mm objective is the whole story here: more light at range than the compact 65mm variant, at a real weight cost. Built from Vortex's own published specifications and MSRP, not hands-on field testing — see our how-we-test page.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT",
    metaTitle: "Vortex Diamondback HD 20-60x85 Spotting Scope — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Vortex Diamondback HD 20-60x85 spotting scope: field of view, close focus, weight, and Vortex's VIP warranty policy.",
    canonicalPath: "/products/vortex-diamondback-hd-20-60x85-angled",
  });

  await upsertOffer({
    id: "offer_vortex_scope_amazon",
    productId: VORTEX_SCOPE_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/Vortex-Optics-Diamondback-Spotting-20-60x85/dp/B08DVBRP18",
    price: 699.99,
    isMsrp: true,
    currency: "USD",
    availability: "UNKNOWN",
    lastChecked: null,
  });

  await upsertProduct({
    id: CELESTRON_SCOPE_ID,
    name: "Celestron Regal M2 20-60x80mm ED (Angled)",
    slug: "celestron-regal-m2-20-60x80ed-angled",
    brand: "Celestron",
    categoryId: "category_spotting_scopes",
    description:
      "An 80mm angled spotting scope from Celestron's Regal M2 line, built around an ED (extra-low dispersion) objective and Celestron's XLT multi-coating. The magnesium alloy body is lighter than a comparable aluminum housing, and the scope ships with a padded case, covers, and a digiscoping T-mount adapter included.",
    shortDescription: "20-60x80mm ED angled spotting scope with magnesium alloy body and included digiscoping adapter.",
    images: [],
    specifications: {
      magnification: "20-60x",
      objectiveLensMm: 80,
      fieldOfView: "110-52 ft @ 1000 yds",
      angleOfView: "2.1-1 degrees",
      closeFocusFt: 21.3,
      eyeReliefMm: 20,
      weightOz: 66.6,
      lengthIn: 19.1,
      waterproof: true,
      fogproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "ED (extra-low dispersion) objective lens with XLT multi-coating",
      "Magnesium alloy body — lighter than a comparable aluminum housing",
      "Dual focus (coarse + fine)",
      "Includes padded case, covers, and T-mount digiscoping adapter",
    ],
    pros: [
      "Included T-mount adapter is a real, usable extra for digiscoping — not every competitor bundles this",
      "20mm eye relief at 20x is comfortable for extended glassing sessions",
    ],
    cons: [
      "66.6 oz (with eyepiece) is heavier than the Vortex Diamondback HD 20-60x85 (60.9 oz) despite a smaller 80mm objective",
      "At $879.95 MSRP, it costs more than the larger-objective Vortex Diamondback HD 20-60x85",
    ],
    whoItsFor:
      "Buyers who specifically want the included digiscoping adapter and don't mind paying more for it, or who have a preference for Celestron's ED glass and coating approach specifically.",
    whoShouldAvoid:
      "Anyone comparing purely on light-gathering-per-dollar should notice the Vortex Diamondback HD 20-60x85 has a larger 85mm objective at a lower MSRP — see the comparison below before assuming more expensive means better here.",
    verdict:
      "On the numbers, this is a harder sell next to the Diamondback HD 20-60x85: smaller objective, heavier in practice, higher MSRP. The real differentiator is the included digiscoping adapter and Celestron's ED glass/coating specifics, not raw spotting performance. Built from Celestron's own published specifications and MSRP, not hands-on field testing.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT",
    metaTitle: "Celestron Regal M2 20-60x80mm ED Spotting Scope — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Celestron Regal M2 20-60x80mm ED spotting scope: field of view, close focus, weight, and included accessories.",
    canonicalPath: "/products/celestron-regal-m2-20-60x80ed-angled",
  });

  await upsertOffer({
    id: "offer_celestron_scope_amazon",
    productId: CELESTRON_SCOPE_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/Celestron-52305-Regal-Spotting-Scope/dp/B00BQ52RDQ",
    price: 879.95,
    isMsrp: true,
    currency: "USD",
    availability: "UNKNOWN",
    lastChecked: null,
  });

  const scopeComparison = {
    id: SCOPE_COMPARISON_ID,
    slug: "vortex-diamondback-hd-20-60x85-vs-celestron-regal-m2-20-60x80ed",
    title: "Vortex Diamondback HD 20-60x85 vs Celestron Regal M2 20-60x80mm ED",
    categoryId: "category_spotting_scopes",
    verdict:
      "Same zoom range (20-60x) on both, but the Vortex has the larger 85mm objective and costs less at MSRP ($699.99 vs $879.95) — on pure specs, it's the stronger pick for light-gathering per dollar. The Celestron's real counter-argument is the included T-mount digiscoping adapter and its lighter-weight-per-unit-objective-size magnesium body construction, plus whatever preference exists for Celestron's specific ED glass and XLT coating over Vortex's HD optical system. Neither brand's optical performance claims have been independently verified here — this is a specs-and-price comparison, not a resolution/brightness test.",
    seoStatus: "DRAFT" as const,
    metaTitle: "Vortex Diamondback HD 20-60x85 vs Celestron Regal M2 80ED — Which Spotting Scope?",
    metaDescription:
      "A spec-by-spec comparison of the Vortex Diamondback HD 20-60x85 and Celestron Regal M2 20-60x80mm ED spotting scopes: objective size, weight, and price.",
    canonicalPath: "/compare/vortex-diamondback-hd-20-60x85-vs-celestron-regal-m2-20-60x80ed",
  };
  await prisma.comparison.upsert({
    where: { id: SCOPE_COMPARISON_ID },
    create: scopeComparison,
    update: scopeComparison,
  });
  for (const [index, productId] of [VORTEX_SCOPE_ID, CELESTRON_SCOPE_ID].entries()) {
    await prisma.comparisonProduct.upsert({
      where: { comparisonId_productId: { comparisonId: SCOPE_COMPARISON_ID, productId } },
      create: { comparisonId: SCOPE_COMPARISON_ID, productId, position: index },
      update: { position: index },
    });
  }

  // ================= Rangefinders =================

  await upsertProduct({
    id: VORTEX_RANGEFINDER_ID,
    name: "Vortex Ranger 1300",
    slug: "vortex-ranger-1300",
    brand: "Vortex Optics",
    categoryId: "category_rangefinders",
    description:
      "A 6x22 laser rangefinder from Vortex rated to 1300 yards on reflective targets and 600 yards on deer-sized targets, with a built-in inclinometer for angle-compensated (HCD) distance readings. Like every Vortex optic, it carries the brand's unconditional VIP lifetime warranty.",
    shortDescription: "6x22 laser rangefinder, 1300 yd reflective range, built-in angle-compensation.",
    images: [],
    specifications: {
      magnification: "6x",
      objectiveLensMm: 22,
      rangeReflectiveYds: "10-1300",
      rangeDeerYds: "10-600",
      accuracy: "±3 yds @ 1000 yds",
      eyeReliefMm: 17,
      weightOz: 7.7,
      batteryType: "CR2",
      waterproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "Angle-compensated (HCD) distance mode via built-in inclinometer",
      "Ranges in under 1 second",
      "2,000+ single-range battery life",
      "Vortex VIP unconditional lifetime warranty",
    ],
    pros: [
      "1300 yd reflective range is genuinely long for this price tier",
      "Angle compensation (HCD) is a real, usable feature for uphill/downhill shots, not just a marketing line",
    ],
    cons: [
      "600 yd max range on deer-sized (non-reflective) targets is the practical ceiling for hunting use — the 1300 yd figure only applies to reflective targets",
      "At $449.99 MSRP, it costs more than double the Leupold RX-1400i TBR/W — see the comparison below for whether that gap is justified for your use case",
    ],
    whoItsFor:
      "Hunters and long-range shooters who want maximum reflective-target range and Vortex's warranty policy, and who don't mind paying a premium over the Leupold.",
    whoShouldAvoid:
      "Anyone whose real-world ranging need tops out well under 600 yards on actual game (not reflective test targets) should weigh whether the extra range and price over the Leupold RX-1400i are worth it for their specific use case.",
    verdict:
      "The headline 1300 yd figure is a reflective-target number — the 600 yd deer-target range is the more practically relevant spec for hunting use, and it's not dramatically ahead of cheaper competitors on that number. Built from Vortex's own published specifications and MSRP, not hands-on field testing.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT",
    metaTitle: "Vortex Ranger 1300 Rangefinder — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Vortex Ranger 1300 rangefinder: range, accuracy, angle compensation, and Vortex's VIP warranty policy.",
    canonicalPath: "/products/vortex-ranger-1300",
  });

  await upsertOffer({
    id: "offer_vortex_ranger_amazon",
    productId: VORTEX_RANGEFINDER_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/vortex-ranger-1300-rangefinder/s?k=vortex+ranger+1300+rangefinder",
    price: 449.99,
    isMsrp: true,
    currency: "USD",
    availability: "UNKNOWN",
    lastChecked: null,
  });

  await upsertProduct({
    id: LEUPOLD_RANGEFINDER_ID,
    name: "Leupold RX-1400i TBR/W Gen 2",
    slug: "leupold-rx-1400i-tbrw-gen2",
    brand: "Leupold",
    categoryId: "category_rangefinders",
    description:
      "A 5x21 laser rangefinder from Leupold rated to 1400 yards on reflective targets and 900 yards on deer-sized targets, with True Ballistic Range/Wind (TBR/W) technology that calculates a ballistic holdover accounting for angle and a 10 mph crosswind. This Gen 2 model adds Leupold's Flightpath archery-specific mode over the original RX-1400i.",
    shortDescription: "5x21 laser rangefinder with True Ballistic Range/Wind holdover calculation.",
    images: [],
    specifications: {
      magnification: "5x",
      objectiveLensMm: 21,
      fieldOfView: "368 ft @ 1000 yds",
      angleOfView: "7 degrees",
      rangeReflectiveYds: "1400",
      rangeTreesYds: "1200",
      rangeDeerYds: "900",
      accuracy: "±0.5 yd to 125 yds, ±2 yds to 1000 yds",
      eyeReliefMm: 18.3,
      weightOz: 5.1,
      batteryType: "CR2",
      waterproof: true,
    } satisfies Prisma.InputJsonValue,
    features: [
      "True Ballistic Range/Wind (TBR/W): angle- and wind-compensated holdover calculation",
      "Flightpath archery-specific mode (Gen 2)",
      "3,000-actuation battery life",
      "High-contrast red OLED display",
    ],
    pros: [
      "5.1 oz is noticeably lighter than the Vortex Ranger 1300's 7.7 oz",
      "$199.99 MSRP is less than half the Vortex Ranger 1300's $449.99",
      "900 yd deer-target range actually exceeds the Vortex Ranger 1300's 600 yd figure — the cheaper unit ranges non-reflective targets farther",
    ],
    cons: [
      "1400 yd reflective-target range is only marginally ahead of the Vortex's 1300 yd figure — not the main reason to pick this one",
      "5x magnification is lower than the Vortex's 6x, a minor tradeoff for a wider field of view",
    ],
    whoItsFor:
      "Hunters who want the best practical (deer-target) range for the money — on that specific number, this outperforms the more expensive Vortex Ranger 1300. Archers will also get direct benefit from the Flightpath mode this Gen 2 model adds.",
    whoShouldAvoid:
      "Anyone who specifically wants Vortex's VIP warranty policy or the marginally longer reflective-target range should compare against the Ranger 1300 directly — see the comparison below.",
    verdict:
      "This is the more practically capable rangefinder for actual hunting distances (900 yd deer range beats the pricier Vortex's 600 yd) at under half the price. The Vortex's advantages are its warranty policy and a slightly longer reflective-target number that matters less than the deer-target figure for real hunting use. Built from Leupold's own published specifications and MSRP, not hands-on field testing.",
    rating: null,
    reviewCount: null,
    seoStatus: "DRAFT",
    metaTitle: "Leupold RX-1400i TBR/W Gen 2 — Specs, Price, and Who It's For",
    metaDescription:
      "A spec-driven look at the Leupold RX-1400i TBR/W Gen 2 rangefinder: range, accuracy, True Ballistic Range/Wind, and price.",
    canonicalPath: "/products/leupold-rx-1400i-tbrw-gen2",
  });

  await upsertOffer({
    id: "offer_leupold_rangefinder_amazon",
    productId: LEUPOLD_RANGEFINDER_ID,
    merchantId: AMAZON_MERCHANT_ID,
    url: "https://www.amazon.com/Leupold-RX-1400i-Flightpath-Rangefinder-183727/dp/B0BTFMGY2L",
    price: 199.99,
    isMsrp: true,
    currency: "USD",
    availability: "UNKNOWN",
    lastChecked: null,
  });

  const rangefinderComparison = {
    id: RANGEFINDER_COMPARISON_ID,
    slug: "vortex-ranger-1300-vs-leupold-rx-1400i-tbrw-gen2",
    title: "Vortex Ranger 1300 vs Leupold RX-1400i TBR/W Gen 2",
    categoryId: "category_rangefinders",
    verdict:
      "The headline reflective-target numbers (1300 yd vs 1400 yd) are close enough not to matter much, but the practically relevant deer-target range favors the cheaper Leupold: 900 yds vs the Vortex's 600 yds. The Leupold is also lighter (5.1 oz vs 7.7 oz) and less than half the Vortex's MSRP ($199.99 vs $449.99). The Vortex's real advantages are its VIP unconditional warranty and 1x higher magnification (6x vs 5x). If deer-target range and price are the deciding factors, the Leupold wins on the numbers; if the warranty policy matters more to you than either, that changes the calculation.",
    seoStatus: "DRAFT" as const,
    metaTitle: "Vortex Ranger 1300 vs Leupold RX-1400i TBR/W Gen 2 — Which Rangefinder?",
    metaDescription:
      "A spec-by-spec comparison of the Vortex Ranger 1300 and Leupold RX-1400i TBR/W Gen 2 rangefinders: range, accuracy, weight, and price.",
    canonicalPath: "/compare/vortex-ranger-1300-vs-leupold-rx-1400i-tbrw-gen2",
  };
  await prisma.comparison.upsert({
    where: { id: RANGEFINDER_COMPARISON_ID },
    create: rangefinderComparison,
    update: rangefinderComparison,
  });
  for (const [index, productId] of [VORTEX_RANGEFINDER_ID, LEUPOLD_RANGEFINDER_ID].entries()) {
    await prisma.comparisonProduct.upsert({
      where: { comparisonId_productId: { comparisonId: RANGEFINDER_COMPARISON_ID, productId } },
      create: { comparisonId: RANGEFINDER_COMPARISON_ID, productId, position: index },
      update: { position: index },
    });
  }

  // ================= Provenance (SourceRecord) =================
  const sourceRecords: Prisma.SourceRecordCreateInput[] = [
    {
      id: "src_vortex_scope_specs",
      product: { connect: { id: VORTEX_SCOPE_ID } },
      source: "Vortex Optics official product page",
      sourceUrl: "https://vortexoptics.com/diamondback-hd-20-60x85-angled.html",
      retrievedAt: RETRIEVED_AT,
      field: "fieldOfView, closeFocusFt, weightOz, msrpUsd",
      value: "108-60 ft @ 1000 yds; 24.6 ft; 60.9 oz; $699.99",
      confidence: "HIGH",
    },
    {
      id: "src_celestron_scope_specs",
      product: { connect: { id: CELESTRON_SCOPE_ID } },
      source: "Celestron official product page",
      sourceUrl: "https://www.celestron.com/products/regal-m2-20-60x80mm-ed-angled-zoom-spotting-scope",
      retrievedAt: RETRIEVED_AT,
      field: "fieldOfView, closeFocusFt, weightOz, msrpUsd",
      value: "110-52 ft @ 1000 yds; 21.3 ft @ 20x; 66.6 oz (with eyepiece); $879.95",
      confidence: "HIGH",
    },
    {
      id: "src_vortex_ranger_specs",
      product: { connect: { id: VORTEX_RANGEFINDER_ID } },
      source: "Vortex Optics official product page",
      sourceUrl: "https://vortexoptics.com/vortex-ranger-1300-rangefinder.html",
      retrievedAt: RETRIEVED_AT,
      field: "rangeReflectiveYds, rangeDeerYds, weightOz, msrpUsd",
      value: "10-1300 yds; 10-600 yds; 7.7 oz; $449.99",
      confidence: "HIGH",
    },
    {
      id: "src_vortex_ranger_accuracy",
      product: { connect: { id: VORTEX_RANGEFINDER_ID } },
      source:
        "Secondary retailer/dealer pages corroborating Vortex's official spec (the official page's own accuracy field extracted ambiguously — see script header note)",
      sourceUrl: "https://www.blackovis.com/vortex-optics-ranger-1300-laser-rangefinder",
      retrievedAt: RETRIEVED_AT,
      field: "accuracy",
      value: "±3 yds @ 1000 yds",
      confidence: "MEDIUM",
    },
    {
      id: "src_leupold_rangefinder_specs",
      product: { connect: { id: LEUPOLD_RANGEFINDER_ID } },
      source: "Leupold official product page",
      sourceUrl: "https://www.leupold.com/rx-1400i-tbr-w-gen-2-rangefinder",
      retrievedAt: RETRIEVED_AT,
      field: "rangeReflectiveYds, rangeDeerYds, weightOz, msrpUsd",
      value: "1400 yds; 900 yds; 5.1 oz; $199.99",
      confidence: "HIGH",
    },
  ];

  for (const record of sourceRecords) {
    await prisma.sourceRecord.upsert({
      where: { id: record.id as string },
      create: record,
      update: record,
    });
  }

  console.log("Content batch 2 (Spotting Scopes + Rangefinders) seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
