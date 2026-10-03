/**
 * Content batch 6: one Guide — "Spotting Scope vs Binoculars for Birding" — built only
 * from data already in the database for the 2 Birding Optics binoculars (both 8x42)
 * and the 2 Spotting Scopes (both 20-60x). No externally sourced specs.
 *
 * Decisions (user-approved, 2026-10-03):
 * - Prices are MSRP (isMsrp: true) and labeled "MSRP" everywhere. The Nikon Monarch M5
 *   has no price on its offer at all; the copy says so explicitly. The unverified
 *   retailer price in its MEDIUM-confidence SourceRecord (optics4birding.com) is NOT
 *   used.
 * - Only documented numbers/specs. No general claims that aren't in the DB (e.g.
 *   "scopes need a tripod", "binoculars are better for birds in flight"). Definitions
 *   of what a spec measures are used; usage advice beyond that is left out.
 * - Scoped explicitly to these four products (8x42 binoculars vs 20-60x scopes), not a
 *   claim about all binoculars or all spotting scopes.
 * - Uses the existing Guide/GuideProduct models; no schema change.
 *
 * Content uses the minimal markup rendered by src/components/content/GuideContent.tsx
 * ("## " headings, "- " bullets, [text](/internal-path) links).
 *
 * Created as seoStatus: DRAFT — promotion is a separate, explicit step after review.
 * Content pages are static: promote BEFORE the deploy that should publish it, or push
 * an empty rebuild commit afterwards (docs/CONTENT_WORKFLOW.md).
 *
 * Idempotent: the upsert's `update` mirrors its `create`, except seoStatus, which
 * is create-only (see withoutSeoStatus below) so a re-run never changes indexability.
 *
 * Run: npx tsx scripts/content-batch-6-guide-spotting-scope-vs-binoculars.ts
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

const GUIDE_ID = "guide_spotting_scope_vs_binoculars_birding";
const VORTEX_BINO_ID = "product_vortex_diamondback_hd_8x42";
const NIKON_BINO_ID = "product_nikon_monarch_m5_8x42";
const VORTEX_SCOPE_ID = "product_vortex_diamondback_hd_20_60x85";
const CELESTRON_SCOPE_ID = "product_celestron_regal_m2_20_60x80ed";

const CONTENT = `This guide compares the two kinds of birding optics we've evaluated so far: two 8x42 binoculars (the Vortex Diamondback HD 8x42 and the Nikon Monarch M5 8x42) and two 20-60x spotting scopes (the Vortex Diamondback HD 20-60x85 and the Celestron Regal M2 20-60x80mm ED). It's a comparison of these four products specifically, not of every binocular or spotting scope on the market. All figures below are the manufacturers' published specifications. Prices are manufacturer's suggested retail prices (MSRP), not live retailer prices.

## Magnification

The binoculars magnify 8x. The spotting scopes zoom from 20x to 60x, so even at their lowest setting they magnify 2.5 times as much as the binoculars, and 7.5 times as much at 60x.

## Field of view

Field of view is how wide an area you see at a given distance. Both binoculars show more than either scope at any zoom setting:

- Vortex Diamondback HD 8x42: 393 ft at 1,000 yards
- Nikon Monarch M5 8x42: 335 ft at 1,000 yards
- Vortex Diamondback HD 20-60x85: 108 ft at 20x, narrowing to 60 ft at 60x
- Celestron Regal M2 20-60x80mm ED: 110 ft at 20x, narrowing to 52 ft at 60x

At the scopes' lowest zoom, the binoculars' field of view is roughly 3 to 3.6 times wider. At 60x it's roughly 5.6 to 7.6 times wider.

## Close focus

Close focus is the nearest distance an optic can bring into focus. The binoculars focus much closer: 5 ft for the Vortex and 8.2 ft for the Nikon, versus 21.3 ft for the Celestron and 24.6 ft for the Vortex scope.

## Weight and size

The binoculars weigh 21.8 oz (Vortex) and 22.2 oz (Nikon). The scopes weigh 60.9 oz (Vortex, 16 in long) and 66.6 oz (Celestron, 19.1 in long), roughly three times as much.

## Weather sealing

All four are listed as waterproof and fogproof.

## Price (MSRP)

- Vortex Diamondback HD 8x42: $319.99 MSRP
- Nikon Monarch M5 8x42: no verified price on file
- Vortex Diamondback HD 20-60x85: $699.99 MSRP
- Celestron Regal M2 20-60x80mm ED: $879.95 MSRP

Comparing the priced units, the scopes cost roughly 2.2 to 2.8 times the Vortex binocular's MSRP.

## Which type fits which priority

On these four products' specs, the trade-off is clear. Pick from the binoculars if field of view, close focus, or low weight matters most to you: they win on all three, and the one priced binocular (the Vortex) also costs less than either scope at MSRP. Pick from the scopes if magnification is the priority: they offer 20x to 60x versus 8x, at roughly three times the weight and roughly 2.2 to 2.8 times the Vortex binocular's MSRP.

## Going deeper

- Binoculars head to head: [Vortex Diamondback HD 8x42 vs Nikon Monarch M5 8x42](/compare/vortex-diamondback-hd-8x42-vs-nikon-monarch-m5-8x42)
- Scopes head to head: [Vortex Diamondback HD 20-60x85 vs Celestron Regal M2 20-60x80mm ED](/compare/vortex-diamondback-hd-20-60x85-vs-celestron-regal-m2-20-60x80ed)
- Our scope roundup: [Best Spotting Scopes](/best/spotting-scopes)
- Browse the categories: [Birding Optics](/categories/birding-optics) and [Spotting Scopes](/categories/spotting-scopes)

None of these optics has been field-tested here; this guide is built from manufacturer-published specifications and MSRP.`;

async function main() {
  const guide: Prisma.GuideUncheckedCreateInput = {
    id: GUIDE_ID,
    slug: "spotting-scope-vs-binoculars-birding",
    title: "Spotting Scope vs Binoculars for Birding: 8x42 vs 20-60x Compared",
    intent: "spotting scope vs binoculars for birding",
    content: CONTENT,
    categoryId: "category_birding_optics",
    seoStatus: "DRAFT",
    metaTitle: "Spotting Scope vs Binoculars: 8x42 vs 20-60x",
    metaDescription:
      "Two 8x42 binoculars vs two 20-60x spotting scopes for birding, compared on published specs: magnification, field of view, close focus, weight, and MSRP.",
    canonicalPath: "/guides/spotting-scope-vs-binoculars-birding",
  };

  await prisma.guide.upsert({
    where: { id: GUIDE_ID },
    create: guide,
    update: withoutSeoStatus(guide),
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: VORTEX_BINO_ID, position: 0 },
    { productId: NIKON_BINO_ID, position: 1 },
    { productId: VORTEX_SCOPE_ID, position: 2 },
    { productId: CELESTRON_SCOPE_ID, position: 3 },
  ];

  for (const entry of entries) {
    await prisma.guideProduct.upsert({
      where: { guideId_productId: { guideId: GUIDE_ID, productId: entry.productId } },
      create: { guideId: GUIDE_ID, ...entry },
      update: entry,
    });
  }

  console.log(`Guide ${GUIDE_ID} upserted (seoStatus: DRAFT if new, otherwise unchanged) with ${entries.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
