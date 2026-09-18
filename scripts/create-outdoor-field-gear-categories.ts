/**
 * One-off script: creates the "Outdoor & Field Gear" parent category and its three
 * sub-niche children (Birding Optics, Spotting Scopes, Rangefinders), per the
 * structure reviewed and approved separately. Idempotent (upsert by fixed id) — safe
 * to re-run. Does NOT touch the existing Home Office categories (Standing Desks,
 * Ergonomic Chairs), which stay untouched top-level categories.
 *
 * Run: npx tsx scripts/create-outdoor-field-gear-categories.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    id: "category_outdoor_field_gear",
    name: "Outdoor & Field Gear",
    slug: "outdoor-field-gear",
    parentId: null,
    description:
      "Parent hub for outdoor observation and field equipment — optics and adjacent gear for birding, wildlife watching, and long-distance field use.",
  },
  {
    id: "category_birding_optics",
    name: "Birding Optics",
    slug: "birding-optics",
    parentId: "category_outdoor_field_gear",
    description:
      "Binoculars for birding — 8x42/10x42/8x32 configurations, spec-driven comparisons (field of view, close focus, ED glass, prism type).",
  },
  {
    id: "category_spotting_scopes",
    name: "Spotting Scopes",
    slug: "spotting-scopes",
    parentId: "category_outdoor_field_gear",
    description:
      "Spotting scopes for long-range birding and wildlife observation — the documented next step once the binocular vertical has traction.",
  },
  {
    id: "category_rangefinders",
    name: "Rangefinders",
    slug: "rangefinders",
    parentId: "category_outdoor_field_gear",
    description:
      "Rangefinders for hunting, golf, and field use — same merchant/affiliate ecosystem as birding optics (OpticsPlanet, Amazon, eBay).",
  },
];

async function main() {
  // Parent first, so children's parentId FK resolves.
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: category,
      update: category,
    });
    console.log(`Upserted category: ${category.name} (${category.slug})`);
  }
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
