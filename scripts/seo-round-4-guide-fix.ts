/**
 * SEO round 4 (user-approved 2026-11-13): replace "via a built-in inclinometer" with
 * ", per Vortex" in the budget-vs-premium rangefinder guide. Change list:
 * scripts/seo-round-4-guide-fix.data.ts. Rollback: scripts/seo-round-4-guide-fix-rollback.ts.
 *
 * Same guarded mechanism as rounds 2 and 3 (applyChanges in scripts/seo-round-2-claims.ts):
 * the field must hold its exact expected old value or nothing is written; plain update in
 * one transaction; no upserts; seoStatus, titles, meta descriptions, prices and offers are
 * never touched. Content pages are static: this goes live only on the next build
 * (docs/CONTENT_WORKFLOW.md). Run once; a re-run aborts on the guard.
 *
 * Run: npx tsx scripts/seo-round-4-guide-fix.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND4_CHANGES } from "./seo-round-4-guide-fix.data";
import { applyChanges } from "./seo-round-2-claims";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

applyChanges(prisma, ROUND4_CHANGES, "apply")
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
