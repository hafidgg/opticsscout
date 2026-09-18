/**
 * Utility: set seoStatus on a Product/Comparison/Guide/BestPage by id, via Prisma
 * (not raw SQL) — used to temporarily promote draft content for a rendered preview,
 * or to actually promote content once it's been reviewed and approved.
 *
 * Run: npx tsx scripts/set-seo-status.ts <model> <id> <status>
 *   model: product | comparison | guide | bestPage
 *   status: DRAFT | REVIEW | READY | INDEXABLE | NOINDEX | ARCHIVED
 */

import "dotenv/config";
import { PrismaClient, type SeoStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [model, id, status] = process.argv.slice(2);
  if (!model || !id || !status) {
    console.error("Usage: tsx scripts/set-seo-status.ts <product|comparison|guide|bestPage> <id> <status>");
    process.exitCode = 1;
    return;
  }

  const data = { seoStatus: status as SeoStatus };
  switch (model) {
    case "product":
      await prisma.product.update({ where: { id }, data });
      break;
    case "comparison":
      await prisma.comparison.update({ where: { id }, data });
      break;
    case "guide":
      await prisma.guide.update({ where: { id }, data });
      break;
    case "bestPage":
      await prisma.bestPage.update({ where: { id }, data });
      break;
    default:
      console.error(`Unknown model: ${model}`);
      process.exitCode = 1;
      return;
  }
  console.log(`${model} ${id} -> ${status}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
