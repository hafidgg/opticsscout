/**
 * SEO round 1 (user-approved 2026-11-08): titles, meta descriptions, and a few short
 * text fixes on existing pages, built only from data already in the database. No new
 * pages, no price/offer/JSON-LD changes.
 *
 * Narrow by design: plain `update`s on exactly these rows/fields (no upserts, so no
 * other row's updatedAt changes), and seoStatus is never written. Every field is
 * guarded: if it no longer holds the expected old text, the script aborts before
 * writing anything (all updates run in one transaction).
 *
 * - 3 Category.description: spotting-scopes, rangefinders, birding-optics. Replaces
 *   internal planning notes / inaccurate text that was shown as the meta description
 *   and under the H1.
 * - 2 BestPage: rangefinders-under-500 (metaDescription + one added verdict sentence
 *   answering "under $400" from MSRPs $199.99 / $449.99); spotting-scopes (metaTitle +
 *   metaDescription naming the two models and MSRPs).
 * - 2 Product rows: shorter metaTitle for the Vortex Diamondback HD 8x42 and the Vortex
 *   Ranger 1300; on the Vortex 8x42 also cons (removes a reference to a guide that
 *   doesn't exist and an unsupported 8x32 comparison) and whoShouldAvoid (drops the
 *   unsupported 8x32 sentence).
 *
 * Content pages are static: this goes live only on the next build
 * (docs/CONTENT_WORKFLOW.md). Run once; a re-run aborts on the guards.
 *
 * Run: npx tsx scripts/seo-round-1-meta.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const RF_VERDICT_OLD =
  "Both rangefinders we've evaluated so far come in under $500 at MSRP, and on the published specs the cheaper one is the stronger pick for most hunting use. The Leupold RX-1400i TBR/W Gen 2 ($199.99 MSRP) ranges deer-sized targets to 900 yards versus the Vortex Ranger 1300's 600, weighs 5.1 oz versus 7.7 oz, and adds True Ballistic Range/Wind holdover calculation plus a Flightpath archery mode. The Vortex Ranger 1300 ($449.99 MSRP) makes sense if Vortex's unconditional VIP lifetime warranty matters to you, or you prefer its 6x magnification over the Leupold's 5x — its headline 1300-yard figure applies to reflective targets only, and is slightly below the Leupold's 1400. Neither rangefinder's real-world performance has been independently field-tested here — see how we test.";

const VORTEX_8X42_WHO_SHOULD_AVOID_OLD =
  "Glasses wearers who need generous eye relief should compare this against the Nikon Monarch M5's 19.5mm eye relief before buying — see the comparison below. Anyone prioritizing minimum pack weight over field of view should also look at compact 8x32 designs instead of this 8x42.";

type Change = { model: "category" | "bestPage" | "product"; id: string; field: string; from: unknown; to: unknown };

const CHANGES: Change[] = [
  {
    model: "category",
    id: "category_spotting_scopes",
    field: "description",
    from: "Spotting scopes for long-range birding and wildlife observation — the documented next step once the binocular vertical has traction.",
    to: "Spotting scopes for birding and wildlife at long range. We compare the two 20-60x scopes we have evaluated so far on published specs and MSRP.",
  },
  {
    model: "category",
    id: "category_rangefinders",
    field: "description",
    from: "Rangefinders for hunting, golf, and field use — same merchant/affiliate ecosystem as birding optics (OpticsPlanet, Amazon, eBay).",
    to: "Laser rangefinders compared on published specs: range on reflective and deer-sized targets, weight and MSRP. Both models we cover are under $500.",
  },
  {
    model: "category",
    id: "category_birding_optics",
    field: "description",
    from: "Binoculars for birding — 8x42/10x42/8x32 configurations, spec-driven comparisons (field of view, close focus, ED glass, prism type).",
    to: "8x42 and 10x42 birding binoculars compared on published specs: field of view, close focus, eye relief, weight and MSRP.",
  },
  {
    model: "bestPage",
    id: "best_rangefinders_under_500",
    field: "metaDescription",
    from: "The two rangefinders we've evaluated so far, both under $500 MSRP, compared on real specs — deer-target range, weight, and ballistic features.",
    to: "The two rangefinders we have evaluated, both under $500 MSRP and one under $400, compared on published specs: deer-target range, weight and ballistics.",
  },
  {
    model: "bestPage",
    id: "best_rangefinders_under_500",
    field: "verdict",
    from: RF_VERDICT_OLD,
    to: `${RF_VERDICT_OLD} If your budget is under $400, only the Leupold RX-1400i TBR/W Gen 2 ($199.99 MSRP) of the two fits; the Vortex Ranger 1300's MSRP is $449.99.`,
  },
  {
    model: "bestPage",
    id: "best_spotting_scopes",
    field: "metaTitle",
    from: "Best Spotting Scopes — Compared",
    to: "Best Spotting Scopes: 2 Models Compared",
  },
  {
    model: "bestPage",
    id: "best_spotting_scopes",
    field: "metaDescription",
    from: "The two spotting scopes we've evaluated so far, compared on real specs and MSRP — objective size, weight, and included extras.",
    to: "Vortex Diamondback HD 20-60x85 ($699.99 MSRP) vs Celestron Regal M2 20-60x80 ED ($879.95 MSRP): the two spotting scopes we have evaluated, on specs.",
  },
  {
    model: "product",
    id: "product_vortex_diamondback_hd_8x42",
    field: "metaTitle",
    from: "Vortex Diamondback HD 8x42 — Specs, Price, and Who It's For",
    to: "Vortex Diamondback HD 8x42 Binocular Specs",
  },
  {
    model: "product",
    id: "product_vortex_ranger_1300",
    field: "metaTitle",
    from: "Vortex Ranger 1300 Rangefinder — Specs, Price, and Who It's For",
    to: "Vortex Ranger 1300 Rangefinder: Specs and MSRP",
  },
  {
    model: "product",
    id: "product_vortex_diamondback_hd_8x42",
    field: "cons",
    from: [
      "17mm eye relief is workable but not class-leading for glasses wearers — see our eyeglass-wearer guide before assuming it's comfortable for you",
      "21.8 oz is on the heavier side for an all-day carry compared to compact 8x32 alternatives",
    ],
    to: ["17mm eye relief, versus 19.5mm on the Nikon Monarch M5 8x42 — glasses wearers should compare the two before buying"],
  },
  {
    model: "product",
    id: "product_vortex_diamondback_hd_8x42",
    field: "whoShouldAvoid",
    from: VORTEX_8X42_WHO_SHOULD_AVOID_OLD,
    to: "Glasses wearers who need generous eye relief should compare this against the Nikon Monarch M5's 19.5mm eye relief before buying — see the comparison below.",
  },
];

async function readField(change: Change): Promise<unknown> {
  const select = { [change.field]: true } as Record<string, true>;
  const row =
    change.model === "category"
      ? await prisma.category.findUnique({ where: { id: change.id }, select })
      : change.model === "bestPage"
        ? await prisma.bestPage.findUnique({ where: { id: change.id }, select })
        : await prisma.product.findUnique({ where: { id: change.id }, select });
  if (!row) throw new Error(`${change.model} ${change.id} not found`);
  return (row as Record<string, unknown>)[change.field];
}

async function main() {
  // Guards: every field must still hold exactly the expected old value.
  for (const change of CHANGES) {
    const current = await readField(change);
    if (JSON.stringify(current) !== JSON.stringify(change.from)) {
      throw new Error(
        `Guard failed — ${change.model} ${change.id}.${change.field} no longer holds the expected text; nothing was written.\n  current: ${JSON.stringify(current)}`
      );
    }
  }

  // Group per row so each row gets exactly one update.
  const byRow = new Map<string, { model: Change["model"]; id: string; data: Record<string, unknown> }>();
  for (const change of CHANGES) {
    const key = `${change.model}:${change.id}`;
    const entry = byRow.get(key) ?? { model: change.model, id: change.id, data: {} };
    entry.data[change.field] = change.to;
    byRow.set(key, entry);
  }

  await prisma.$transaction(
    [...byRow.values()].map(({ model, id, data }) =>
      model === "category"
        ? prisma.category.update({ where: { id }, data })
        : model === "bestPage"
          ? prisma.bestPage.update({ where: { id }, data })
          : prisma.product.update({ where: { id }, data })
    )
  );

  for (const { model, id, data } of byRow.values()) {
    console.log(`updated ${model} ${id}: ${Object.keys(data).join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
