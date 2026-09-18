/**
 * Seeds the dev database with the small, representative mock dataset from
 * src/lib/mock-data/* — the same content the app used before Prisma existed, now
 * inserted as real rows so the repository/gate/route pipeline can be verified
 * end-to-end against a real database. Idempotent (safe to re-run): every write is an
 * upsert keyed by the record's fixed mock id.
 */

import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MOCK_CATEGORIES } from "../src/lib/mock-data/categories";
import { MOCK_MERCHANTS } from "../src/lib/mock-data/merchants";
import { MOCK_PRODUCTS } from "../src/lib/mock-data/products";
import { MOCK_OFFERS } from "../src/lib/mock-data/offers";
import { MOCK_COMPARISONS } from "../src/lib/mock-data/comparisons";
import { MOCK_GUIDES } from "../src/lib/mock-data/guides";
import { MOCK_BEST_PAGES } from "../src/lib/mock-data/best-pages";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const rest = { ...obj };
  delete rest[key];
  return rest;
}

async function main() {
  for (const category of MOCK_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: category,
      update: category,
    });
  }

  for (const merchant of MOCK_MERCHANTS) {
    await prisma.merchant.upsert({
      where: { id: merchant.id },
      create: merchant,
      update: merchant,
    });
  }

  for (const product of MOCK_PRODUCTS) {
    const productFields = omit(product, "alternativeProductIds");
    await prisma.product.upsert({
      where: { id: product.id },
      create: productFields,
      update: productFields,
    });
  }

  // Second pass: wire up the Product.alternatives self-relation now that every
  // product row exists. Connecting from one side also connects the reverse
  // (alternativeOf) side — Prisma implicit many-to-many is symmetric.
  for (const product of MOCK_PRODUCTS) {
    if (product.alternativeProductIds?.length) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          alternatives: {
            connect: product.alternativeProductIds.map((id) => ({ id })),
          },
        },
      });
    }
  }

  for (const offer of MOCK_OFFERS) {
    // trackingMetadata is a nullable Json column — Prisma requires the JsonNull
    // sentinel rather than a plain JS `null` to mean "set this column to SQL NULL".
    const data = { ...omit(offer, "trackingMetadata"), trackingMetadata: Prisma.JsonNull };
    await prisma.productOffer.upsert({
      where: { id: offer.id },
      create: data,
      update: data,
    });
  }

  for (const comparison of MOCK_COMPARISONS) {
    const { productIds, ...comparisonFields } = comparison;
    await prisma.comparison.upsert({
      where: { id: comparison.id },
      create: comparisonFields,
      update: comparisonFields,
    });
    for (const [index, productId] of productIds.entries()) {
      await prisma.comparisonProduct.upsert({
        where: { comparisonId_productId: { comparisonId: comparison.id, productId } },
        create: { comparisonId: comparison.id, productId, position: index },
        update: { position: index },
      });
    }
  }

  for (const guide of MOCK_GUIDES) {
    const { productIds, ...guideFields } = guide;
    await prisma.guide.upsert({
      where: { id: guide.id },
      create: guideFields,
      update: guideFields,
    });
    for (const [index, productId] of productIds.entries()) {
      await prisma.guideProduct.upsert({
        where: { guideId_productId: { guideId: guide.id, productId } },
        create: { guideId: guide.id, productId, position: index },
        update: { position: index },
      });
    }
  }

  for (const bestPage of MOCK_BEST_PAGES) {
    const { productIds, ...bestPageFields } = bestPage;
    await prisma.bestPage.upsert({
      where: { id: bestPage.id },
      create: bestPageFields,
      update: bestPageFields,
    });
    for (const [index, productId] of productIds.entries()) {
      await prisma.bestPageProduct.upsert({
        where: { bestPageId_productId: { bestPageId: bestPage.id, productId } },
        create: { bestPageId: bestPage.id, productId, position: index },
        update: { position: index },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
