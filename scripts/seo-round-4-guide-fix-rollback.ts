/**
 * ROLLBACK for SEO round 4 (scripts/seo-round-4-guide-fix.ts). Prepared, NOT run.
 *
 * Restores the budget-vs-premium guide content to its exact pre-round-4 value (the `from`
 * in scripts/seo-round-4-guide-fix.data.ts). Guarded: aborts without writing unless the
 * field still holds the round-4 value. Plain update in one transaction; seoStatus,
 * titles, meta descriptions, prices and offers are never touched. Content pages are
 * static: after running, push an empty rebuild commit (docs/CONTENT_WORKFLOW.md). Only
 * run with explicit approval.
 *
 * Run: npx tsx scripts/seo-round-4-guide-fix-rollback.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND4_CHANGES } from "./seo-round-4-guide-fix.data";
import { applyChanges } from "./seo-round-2-claims";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

applyChanges(prisma, ROUND4_CHANGES, "rollback")
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
