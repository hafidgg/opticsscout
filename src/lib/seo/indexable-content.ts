/**
 * Queries content eligible for the sitemap / crawl-facing surfaces.
 *
 * The critical invariant — only seoStatus === "INDEXABLE" content is ever returned —
 * must hold identically across every function below. Do not relax this filter.
 */

import { prisma } from "@/lib/db/client";

export interface IndexableEntry {
  path: string;
  lastModified: Date;
}

export async function getIndexableProductPaths(): Promise<IndexableEntry[]> {
  const products = await prisma.product.findMany({
    where: { seoStatus: "INDEXABLE" },
    select: { slug: true, canonicalPath: true, updatedAt: true },
  });
  return products.map((p) => ({
    path: p.canonicalPath ?? `/products/${p.slug}`,
    lastModified: p.updatedAt,
  }));
}

export async function getIndexableComparisonPaths(): Promise<IndexableEntry[]> {
  const comparisons = await prisma.comparison.findMany({
    where: { seoStatus: "INDEXABLE" },
    select: { slug: true, canonicalPath: true, updatedAt: true },
  });
  return comparisons.map((c) => ({
    path: c.canonicalPath ?? `/compare/${c.slug}`,
    lastModified: c.updatedAt,
  }));
}

export async function getIndexableGuidePaths(): Promise<IndexableEntry[]> {
  const guides = await prisma.guide.findMany({
    where: { seoStatus: "INDEXABLE" },
    select: { slug: true, canonicalPath: true, updatedAt: true },
  });
  return guides.map((g) => ({
    path: g.canonicalPath ?? `/guides/${g.slug}`,
    lastModified: g.updatedAt,
  }));
}

export async function getIndexableBestPagePaths(): Promise<IndexableEntry[]> {
  const bestPages = await prisma.bestPage.findMany({
    where: { seoStatus: "INDEXABLE" },
    select: { slug: true, canonicalPath: true, updatedAt: true },
  });
  return bestPages.map((b) => ({
    path: b.canonicalPath ?? `/best/${b.slug}`,
    lastModified: b.updatedAt,
  }));
}

/**
 * Category hubs don't have their own seoStatus — a category is included only when it
 * has at least one INDEXABLE product, so the sitemap never lists an empty hub.
 */
export async function getIndexableCategoryPaths(): Promise<IndexableEntry[]> {
  const categories = await prisma.category.findMany({
    where: { products: { some: { seoStatus: "INDEXABLE" } } },
    select: { slug: true, updatedAt: true },
  });
  return categories.map((c) => ({
    path: `/categories/${c.slug}`,
    lastModified: c.updatedAt,
  }));
}
