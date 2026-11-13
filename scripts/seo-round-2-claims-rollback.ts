/**
 * ROLLBACK for SEO round 2 (scripts/seo-round-2-claims.ts). Prepared, NOT run.
 *
 * Restores every field changed by round 2 to its exact pre-round-2 value (the `from`
 * values in scripts/seo-round-2-claims.data.ts, copied byte-for-byte from production on
 * 2026-11-13). Guarded the same way: aborts without writing anything unless every field
 * still holds the round-2 value. Plain updates in one transaction; seoStatus, titles,
 * meta descriptions, prices and offers are never touched.
 *
 * Content pages are static: after running, push an empty rebuild commit
 * (docs/CONTENT_WORKFLOW.md). Only run with explicit approval.
 *
 * Run: npx tsx scripts/seo-round-2-claims-rollback.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND2_CHANGES } from "./seo-round-2-claims.data";
import { applyChanges } from "./seo-round-2-claims";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

applyChanges(prisma, ROUND2_CHANGES, "rollback")
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
