/**
 * ROLLBACK for SEO round 3 (scripts/seo-round-3-facts.ts). Prepared, NOT run.
 *
 * Restores every field changed by round 3 to its exact pre-round-3 value (the `from`
 * values in scripts/seo-round-3-facts.data.ts). Guarded: aborts without writing unless
 * every field still holds its round-3 value. Plain updates in one transaction; seoStatus,
 * titles, meta descriptions, prices and offers are never touched. Content pages are
 * static: after running, push an empty rebuild commit (docs/CONTENT_WORKFLOW.md). Only
 * run with explicit approval.
 *
 * Run: npx tsx scripts/seo-round-3-facts-rollback.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND3_CHANGES } from "./seo-round-3-facts.data";
import { applyChanges } from "./seo-round-2-claims";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

applyChanges(prisma, ROUND3_CHANGES, "rollback")
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
