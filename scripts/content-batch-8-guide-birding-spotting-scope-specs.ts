/**
 * Content batch 8: one Guide — "Birding Spotting Scopes: How to Read the Specs" —
 * built only from data already in the database for the two Spotting Scopes products,
 * plus general definitions. No new products, offers, prices or specs.
 *
 * Decisions (user-approved, 2026-11-12):
 * - Explains what each spec means using the two scopes as examples; no ranking, no
 *   recommendation, no "best for" verdict (that belongs to /best/spotting-scopes), and
 *   no binoculars comparison (that's /guides/spotting-scope-vs-binoculars-birding).
 * - Only values re-verified against the manufacturers' pages on 2026-11-12:
 *   Vortex https://vortexoptics.com/diamondback-hd-20-60x85-angled.html and
 *   Celestron https://www.celestron.com/products/regal-m2-20-60x80mm-ed-angled-zoom-spotting-scope
 *   Left out because they could not be verified there: the Vortex "built-in sunshade"
 *   (not on Vortex's page), the Celestron length (not on Celestron's page), and the
 *   Celestron MSRP (the page shows $882.60, the DB has $879.95) — so this guide quotes
 *   no prices at all.
 * - Excluded on purpose (no performance or usage claims): light gathering / low-light
 *   benefit of a larger objective, angled-vs-straight usage advice, high-zoom image
 *   quality, tripod requirements, what ED/HD glass or coatings do, magnesium-vs-aluminum
 *   weight claims, sunshade effects, the 65mm Diamondback HD, and any "best for".
 * - Features are attributed to each manufacturer. Uses the existing Guide/GuideProduct
 *   models; no schema change. Links both scopes via GuideProduct ("Our picks" cards),
 *   which the quality gate's product-coverage check requires (user decision 2026-11-12).
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
 * Run: npx tsx scripts/content-batch-8-guide-birding-spotting-scope-specs.ts
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

const GUIDE_ID = "guide_birding_spotting_scope_specs_explained";
const VORTEX_SCOPE_ID = "product_vortex_diamondback_hd_20_60x85";
const CELESTRON_SCOPE_ID = "product_celestron_regal_m2_20_60x80ed";

const CONTENT = `This guide explains the main numbers on a birding spotting scope's spec sheet, using the two spotting scopes we have on file as examples: the Vortex Diamondback HD 20-60x85 (Angled) and the Celestron Regal M2 20-60x80mm ED (Angled). It explains what each spec means; it doesn't rank the two scopes or recommend one over the other. All figures are the manufacturers' published specifications.

## What "20-60x85" means

A spotting scope's name usually carries two numbers. The first part is the magnification range: a 20-60x scope is a zoom scope that magnifies 20 times at its lowest setting and 60 times at its highest. The number after it is the diameter of the objective lens, the large front lens, in millimeters. So the Vortex Diamondback HD 20-60x85 zooms from 20x to 60x with an 85 mm objective lens, and the Celestron Regal M2 20-60x80mm ED zooms over the same range with an 80 mm objective lens.

## Zoom and field of view

Field of view is how wide an area you see at a given distance. On both of these scopes, the manufacturer publishes it as a range, from the lowest zoom setting to the highest, and the area gets narrower as you zoom in:

- Vortex Diamondback HD 20-60x85: 108 ft at 1,000 yards at the low end of the zoom, narrowing to 60 ft at the high end (an angular field of view of 2.1° to 1.1°)
- Celestron Regal M2 20-60x80mm ED: 110 ft at 1,000 yards at the low end of the zoom, narrowing to 52 ft at the high end (2.1° to 1°), with the included eyepiece

## Angled and straight bodies

Spotting scopes come in two body styles. On a straight scope, the eyepiece is in line with the body. On an angled scope, the eyepiece is set at an angle to the body. Both scopes in this guide are the angled versions of their models. We don't have a straight-body scope on file, so this guide doesn't compare the two styles.

## Close focus

Close focus is the nearest distance a scope can bring into focus. Vortex lists 24.6 ft for the Diamondback HD 20-60x85. Celestron lists 21.3 ft for the Regal M2 20-60x80mm ED, measured at 20x with the included eyepiece.

## Eye relief

Eye relief is the distance from the eyepiece at which you can see the full image. Vortex lists 18.3 mm to 20.3 mm for the Diamondback HD 20-60x85. Celestron lists 20 mm for the Regal M2 20-60x80mm ED, measured at 20x with the included eyepiece.

## Weight and weather sealing

Vortex lists a weight of 60.9 oz for the Diamondback HD 20-60x85. Celestron lists 66.6 oz for the Regal M2 20-60x80mm ED with the included eyepiece attached, and 55.5 oz without it. Both are listed as waterproof and fogproof: Vortex describes the Diamondback HD as gas purged and O-ring sealed, and Celestron describes the Regal M2 as waterproof and nitrogen-purged.

## What each manufacturer lists

Per Vortex, the Diamondback HD 20-60x85 has:

- an HD optical system with anti-reflective coatings
- an Arca-Swiss compatible, tripod-adaptable body
- Vortex's VIP unconditional lifetime warranty

Per Celestron, the Regal M2 20-60x80mm ED has:

- an ED (extra-low dispersion) objective lens and XLT fully multi-coated optics
- a magnesium alloy body
- dual focus, with coarse and fine focus controls
- an included T-adapter for attaching a camera with a T-ring
- a soft carrying case, an objective lens cap and an eyepiece cover

We don't have Celestron's warranty terms on file.

## Going deeper

- The two scopes spec by spec: [Vortex Diamondback HD 20-60x85 vs Celestron Regal M2 20-60x80mm ED](/compare/vortex-diamondback-hd-20-60x85-vs-celestron-regal-m2-20-60x80ed)
- Our scope roundup: [Best Spotting Scopes](/best/spotting-scopes)
- Spotting scopes next to binoculars: [Spotting Scope vs Binoculars for Birding](/guides/spotting-scope-vs-binoculars-birding)
- Product details: [Vortex Diamondback HD 20-60x85](/products/vortex-diamondback-hd-20-60x85-angled), [Celestron Regal M2 20-60x80mm ED](/products/celestron-regal-m2-20-60x80ed-angled)
- Browse: [Spotting Scopes](/categories/spotting-scopes)
- How we work: [How we test](/how-we-test)

Neither scope has been field-tested here; this guide is built from manufacturer-published specifications.`;

const guide: Prisma.GuideUncheckedCreateInput = {
  id: GUIDE_ID,
  slug: "birding-spotting-scope-specs-explained",
  title: "Birding Spotting Scopes: How to Read the Specs",
  intent: "birding spotting scope",
  content: CONTENT,
  categoryId: "category_spotting_scopes",
  seoStatus: "DRAFT",
  metaTitle: "Birding Spotting Scope Specs Explained",
  metaDescription:
    "What 20-60x and 85mm mean, angled bodies, zoom vs field of view, close focus and eye relief, shown on two real 20-60x birding spotting scopes.",
  canonicalPath: "/guides/birding-spotting-scope-specs-explained",
};

async function main() {
  await prisma.guide.upsert({
    where: { id: GUIDE_ID },
    create: guide,
    update: withoutSeoStatus(guide),
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: VORTEX_SCOPE_ID, position: 0 },
    { productId: CELESTRON_SCOPE_ID, position: 1 },
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
