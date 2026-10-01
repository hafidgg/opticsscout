/**
 * Content batch 4: one BestPage — "Best Rangefinders Under $500" — built entirely
 * from data already in the database (specs, MSRP, SourceRecord citations for both
 * products; see content-batch-2-scopes-and-rangefinders.ts for where that data came
 * from). No new products, specs, or sources are introduced here.
 *
 * "Under $500" verified against the live DB before writing: Leupold RX-1400i TBR/W
 * Gen 2 $199.99 (Amazon offer, active) and Vortex Ranger 1300 $449.99 (MidwayUSA
 * offer, active). Both prices are MSRP (isMsrp: true), not live merchant prices —
 * the copy says "MSRP" accordingly.
 *
 * Deliberately scoped: with only 2 real Rangefinders products, the verdict is
 * explicit about "the two we've evaluated so far," not a broader market survey.
 * The Vortex accuracy spec (MEDIUM-confidence SourceRecord) is intentionally not
 * used in the verdict.
 *
 * Created as seoStatus: DRAFT — promotion to INDEXABLE is a separate, explicit step
 * pending review (see docs/SEO_CONTENT_ROADMAP.md item #2).
 *
 * Idempotent: the upsert's `update` mirrors its `create`.
 *
 * Run: npx tsx scripts/content-batch-4-best-rangefinders-under-500.ts
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const BEST_PAGE_ID = "best_rangefinders_under_500";
const LEUPOLD_RANGEFINDER_ID = "product_leupold_rx_1400i_tbrw_gen2";
const VORTEX_RANGEFINDER_ID = "product_vortex_ranger_1300";

async function main() {
  const bestPage: Prisma.BestPageUncheckedCreateInput = {
    id: BEST_PAGE_ID,
    slug: "rangefinders-under-500",
    title: "Best Rangefinders Under $500",
    intent: "best rangefinder under $500",
    categoryId: "category_rangefinders",
    verdict:
      "Both rangefinders we've evaluated so far come in under $500 at MSRP, and on the published specs the cheaper one is the stronger pick for most hunting use. The Leupold RX-1400i TBR/W Gen 2 ($199.99 MSRP) ranges deer-sized targets to 900 yards versus the Vortex Ranger 1300's 600, weighs 5.1 oz versus 7.7 oz, and adds True Ballistic Range/Wind holdover calculation plus a Flightpath archery mode. The Vortex Ranger 1300 ($449.99 MSRP) makes sense if Vortex's unconditional VIP lifetime warranty matters to you, or you prefer its 6x magnification over the Leupold's 5x — its headline 1300-yard figure applies to reflective targets only, and is slightly below the Leupold's 1400. Neither rangefinder's real-world performance has been independently field-tested here — see how we test.",
    seoStatus: "DRAFT",
    metaTitle: "Best Rangefinders Under $500 — Compared",
    metaDescription:
      "The two rangefinders we've evaluated so far, both under $500 MSRP, compared on real specs — deer-target range, weight, and ballistic features.",
    canonicalPath: "/best/rangefinders-under-500",
  };

  await prisma.bestPage.upsert({
    where: { id: BEST_PAGE_ID },
    create: bestPage,
    update: bestPage,
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: LEUPOLD_RANGEFINDER_ID, position: 0 },
    { productId: VORTEX_RANGEFINDER_ID, position: 1 },
  ];

  for (const entry of entries) {
    await prisma.bestPageProduct.upsert({
      where: { bestPageId_productId: { bestPageId: BEST_PAGE_ID, productId: entry.productId } },
      create: { bestPageId: BEST_PAGE_ID, ...entry },
      update: entry,
    });
  }

  console.log(`BestPage ${BEST_PAGE_ID} upserted (seoStatus: DRAFT) with ${entries.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
