/**
 * Content batch 3: one BestPage — "Best Spotting Scopes" — built entirely from data
 * already in the database (specs, MSRP, SourceRecord citations for both products;
 * see content-batch-2-scopes-and-rangefinders.ts for where that data came from). No
 * new products, specs, or sources are introduced here — this page just synthesizes
 * an honest verdict from what's already real and sourced.
 *
 * Deliberately scoped: with only 2 real Spotting Scopes products, the verdict is
 * explicit about evaluating "the two we've evaluated so far," not implying a
 * broader market survey.
 *
 * Created as seoStatus: DRAFT — promotion to INDEXABLE is a separate, explicit step
 * pending review (see docs/SEO_CONTENT_ROADMAP.md item #1).
 *
 * Idempotent: the upsert's `update` mirrors its `create`.
 *
 * Run: npx tsx scripts/content-batch-3-best-spotting-scopes.ts
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const BEST_PAGE_ID = "best_spotting_scopes";
const VORTEX_SCOPE_ID = "product_vortex_diamondback_hd_20_60x85";
const CELESTRON_SCOPE_ID = "product_celestron_regal_m2_20_60x80ed";

async function main() {
  const bestPage: Prisma.BestPageUncheckedCreateInput = {
    id: BEST_PAGE_ID,
    slug: "spotting-scopes",
    title: "Best Spotting Scopes",
    intent: "best spotting scope",
    categoryId: "category_spotting_scopes",
    verdict:
      "Between the two spotting scopes we've evaluated so far, the Vortex Diamondback HD 20-60x85 is the stronger pick on pure specs: a larger 85mm objective for more light at range, a lower $699.99 MSRP than the Celestron's $879.95, and Vortex's unconditional VIP warranty. The Celestron Regal M2 20-60x80mm ED costs more and is heavier, but includes a T-mount digiscoping adapter and Celestron's own ED glass and XLT coating — worth it specifically if digiscoping is why you're buying one, less so if you're optimizing for light-gathering per dollar. Neither scope's real-world optical performance has been independently field-tested here — see how we test.",
    seoStatus: "DRAFT",
    metaTitle: "Best Spotting Scopes — Compared",
    metaDescription:
      "The two spotting scopes we've evaluated so far, compared on real specs and MSRP — objective size, weight, and included extras.",
    canonicalPath: "/best/spotting-scopes",
  };

  await prisma.bestPage.upsert({
    where: { id: BEST_PAGE_ID },
    create: bestPage,
    update: bestPage,
  });

  const entries: Array<{ productId: string; position: number }> = [
    { productId: VORTEX_SCOPE_ID, position: 0 },
    { productId: CELESTRON_SCOPE_ID, position: 1 },
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
