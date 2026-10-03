/**
 * Content batch 5: one Guide — "Budget vs Premium Rangefinder: Is the Extra Money
 * Worth It?" (docs/SEO_CONTENT_ROADMAP.md item #5) — built only from data already in
 * the database for the two Rangefinders products. No externally sourced specs.
 *
 * Decisions (user-approved, 2026-10-03):
 * - Prices are MSRP (both offers isMsrp: true) and are labeled "MSRP" everywhere.
 * - Decision-framework angle that links to the existing head-to-head comparison
 *   (/compare/vortex-ranger-1300-vs-leupold-rx-1400i-tbrw-gen2) rather than repeating it.
 * - Only rows with real DB data: range/accuracy, angle compensation, waterproofing,
 *   warranty (where on file). Lens quality, ranging speed, and other build details are
 *   deliberately omitted, not filled in. Leupold's warranty isn't on file, and the copy
 *   says so rather than implying it has none.
 * - Vortex accuracy (±3 yds @ 1000 yds) is a MEDIUM-confidence SourceRecord
 *   (retailer-corroborated, not verbatim from Vortex's page); the copy flags it.
 * - Uses the existing Guide/GuideProduct models; no schema change.
 *
 * Content uses the minimal markup rendered by src/components/content/GuideContent.tsx
 * ("## " headings, "- " bullets, [text](/internal-path) links).
 *
 * Created as seoStatus: DRAFT — promotion is a separate, explicit step after review.
 *
 * Idempotent: the upsert's `update` mirrors its `create`, except seoStatus, which
 * is create-only (see withoutSeoStatus below) so a re-run never changes indexability.
 *
 * Run: npx tsx scripts/content-batch-5-guide-budget-vs-premium-rangefinder.ts
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

const GUIDE_ID = "guide_budget_vs_premium_rangefinder";
const LEUPOLD_RANGEFINDER_ID = "product_leupold_rx_1400i_tbrw_gen2";
const VORTEX_RANGEFINDER_ID = "product_vortex_ranger_1300";

const CONTENT = `When two rangefinders are $250 apart, it's fair to ask what the extra money actually buys. This guide works through that question using the two rangefinders we've evaluated so far: the Leupold RX-1400i TBR/W Gen 2 at $199.99 MSRP and the Vortex Ranger 1300 at $449.99 MSRP, a $250 MSRP difference. "Budget" and "premium" here describe price only. Both prices are manufacturer's suggested retail prices, not live retailer prices, so check the retailer links for what they actually sell for today.

For the full spec-by-spec breakdown of these two units, see our [Vortex Ranger 1300 vs Leupold RX-1400i TBR/W Gen 2 comparison](/compare/vortex-ranger-1300-vs-leupold-rx-1400i-tbrw-gen2). This page focuses on one question: is the price jump worth it?

## What the extra $250 (MSRP) does and doesn't buy

Measured against the specs we have on file, the higher price doesn't buy more range or tighter published accuracy:

- Range: the Leupold is rated to 1,400 yards on reflective targets and 900 yards on deer-sized targets. The Vortex is rated to 1,300 yards reflective and 600 yards on deer. The deer-target figure is the more relevant one for hunting, and there the cheaper unit is rated 300 yards farther.
- Accuracy: Leupold publishes ±0.5 yard to 125 yards and ±2 yards to 1,000 yards. The Vortex figure we have is ±3 yards at 1,000 yards. That figure comes from retailer listings citing Vortex's spec rather than Vortex's own page, so we treat it with somewhat less confidence.
- Angle compensation: both have it. The Vortex has an angle-compensated (HCD) distance mode via a built-in inclinometer. The Leupold's True Ballistic Range/Wind (TBR/W) calculates a holdover that accounts for angle and wind.
- Waterproofing: both are listed as waterproof.
- Warranty: the Vortex carries Vortex's unconditional VIP lifetime warranty. We don't have Leupold's warranty terms on file, so we can't compare the two on this point.

Lens quality, ranging speed, and other build details aren't compared here because we don't have verified data on them for both units.

## Who should buy the budget one

The Leupold RX-1400i TBR/W Gen 2 makes sense if your priority is practical hunting range for the money. On the specs above, it matches or exceeds the Vortex on every range and accuracy figure we have, at less than half the MSRP. Its TBR/W wind-and-angle holdover and its Flightpath archery mode are also on file as features the Vortex doesn't list. [Leupold RX-1400i TBR/W Gen 2 details](/products/leupold-rx-1400i-tbrw-gen2)

## Who should buy the premium one

The Vortex Ranger 1300 makes sense if Vortex's unconditional VIP lifetime warranty is what you're paying for. On the data we have, that warranty is the clearest thing the extra $250 MSRP buys. If long-term coverage matters more to you than the range figures above, the premium can be worth it. [Vortex Ranger 1300 details](/products/vortex-ranger-1300)

## Verdict

On the specs we have on file, the extra money is hard to justify on performance: the budget Leupold is rated farther on deer-sized targets, with tighter published accuracy and ballistic holdover. The premium Vortex's case rests mainly on its warranty policy. Neither unit has been field-tested here; this is based on manufacturer-published specs and MSRP. For where to buy both, see [Best Rangefinders Under $500](/best/rangefinders-under-500).`;

async function main() {
  const guide: Prisma.GuideUncheckedCreateInput = {
    id: GUIDE_ID,
    slug: "budget-vs-premium-rangefinder",
    title: "Budget vs Premium Rangefinder: Is the Extra Money Worth It?",
    intent: "budget vs premium rangefinder",
    content: CONTENT,
    categoryId: "category_rangefinders",
    seoStatus: "DRAFT",
    metaTitle: "Budget vs Premium Rangefinder: Worth It?",
    metaDescription:
      "Is a $449.99 MSRP rangefinder worth $250 more than a $199.99 one? What the extra money does and doesn't buy, using only specs we have on file.",
    canonicalPath: "/guides/budget-vs-premium-rangefinder",
  };

  await prisma.guide.upsert({
    where: { id: GUIDE_ID },
    create: guide,
    update: withoutSeoStatus(guide),
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: LEUPOLD_RANGEFINDER_ID, position: 0 },
    { productId: VORTEX_RANGEFINDER_ID, position: 1 },
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
