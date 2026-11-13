/**
 * SEO round 3 (user-approved 2026-11-13): small factual fixes on the rangefinder pages.
 * Change list: scripts/seo-round-3-facts.data.ts. Rollback:
 * scripts/seo-round-3-facts-rollback.ts.
 *
 * Same guarded mechanism as round 2 (applyChanges in scripts/seo-round-2-claims.ts):
 * every field must hold its expected old value or nothing is written; plain updates in
 * one transaction; no upserts; seoStatus, titles, meta descriptions, prices and offers are
 * never touched. Content pages are static: this goes live only on the next build
 * (docs/CONTENT_WORKFLOW.md). Run once; a re-run aborts on the guards.
 *
 * Run: npx tsx scripts/seo-round-3-facts.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROUND3_CHANGES } from "./seo-round-3-facts.data";
import { applyChanges } from "./seo-round-2-claims";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

applyChanges(prisma, ROUND3_CHANGES, "apply")
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
