/**
 * Content repository — reads real content via Prisma. This is the ONLY place page
 * routes fetch content from. It is also the ONLY place the Quality Gate is invoked for
 * a given piece of content, which is what makes "every route respects the gate" true
 * by construction rather than by convention — a route cannot bypass the gate without
 * reaching around this module entirely.
 *
 * Pipeline enforced here for every getX() function:
 *   raw content -> build QualityGateInput -> runQualityGate() -> attach result
 *   -> caller (route) decides render/404/noindex based on attached result + seoStatus
 *
 * IMPORTANT: running the gate here does NOT mutate seoStatus. Promotion (e.g.
 * DRAFT -> REVIEW) is a separate, explicit authoring-time action (see
 * lib/seo/quality-gate.ts nextSeoStatus) — this module only reports whether current
 * content WOULD pass, for display/audit purposes, and separately enforces the strict
 * viewer-facing rule: only seoStatus === "INDEXABLE" is ever treated as a live,
 * indexable page. A page that would pass the gate but hasn't been promoted still
 * renders (for REVIEW/READY, so editors can preview it) but is never treated as
 * indexable.
 */

import type { Product, ProductOffer, Merchant, Category } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import {
  runQualityGate,
  type QualityGateResult,
  type EditorialSection,
} from "@/lib/seo/quality-gate";
import { findOverlappingIntent } from "@/lib/seo/duplicate-detection";

// ---------- shared helpers ----------

type OfferWithMerchant = ProductOffer & { merchant: Merchant };

/** Decimal -> plain number for display/JSON-LD; null stays null. */
function toNumber(value: ProductOffer["price"]): number | null {
  return value === null ? null : value.toNumber();
}

function normalizeOffers(offers: OfferWithMerchant[]) {
  return offers.map((offer) => ({ ...offer, price: toNumber(offer.price) }));
}

/** A product's specification data counts as valid if it has at least one real
 *  (non-empty) spec key — an empty object is treated as placeholder/unknown data. */
function isProductDataValid(specifications: unknown): boolean {
  return Boolean(
    specifications &&
      typeof specifications === "object" &&
      !Array.isArray(specifications) &&
      Object.keys(specifications as object).length > 0
  );
}

// ---------- Products ----------

export interface ResolvedProduct {
  product: Product;
  category: Category | null;
  offers: ReturnType<typeof normalizeOffers>;
  gateResult: QualityGateResult;
  /** The strict viewer-facing decision — see module header. */
  isIndexable: boolean;
}

export async function getProductBySlug(slug: string): Promise<ResolvedProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, offers: { include: { merchant: true } } },
  });
  if (!product) return null;

  const { category, offers: rawOffers, ...productFields } = product;
  const offers = normalizeOffers(rawOffers);

  const editorialSections: EditorialSection[] = [
    { name: "verdict", text: productFields.verdict, required: true },
    { name: "whoItsFor", text: productFields.whoItsFor, required: true },
    { name: "whoShouldAvoid", text: productFields.whoShouldAvoid, required: false },
  ];

  const gateResult = runQualityGate({
    pageType: "product",
    metaTitle: productFields.metaTitle,
    metaDescription: productFields.metaDescription,
    canonicalPath: productFields.canonicalPath,
    editorialSections,
    referencedProductIds: [productFields.id],
    productDataValidity: { [productFields.id]: isProductDataValid(productFields.specifications) },
    offerHealth: offers.map((o) => ({ offerId: o.id, urlResolves: true })),
    internalLinkCount: category ? 1 : 0,
    overlappingIntentSlugs: [],
  });

  return {
    product,
    category,
    offers,
    gateResult,
    isIndexable: product.seoStatus === "INDEXABLE",
  };
}

export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ---------- Categories ----------

export interface ResolvedCategory {
  category: Category;
  products: Product[];
}

export async function getCategoryBySlug(slug: string): Promise<ResolvedCategory | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { products: true },
  });
  if (!category) return null;

  const { products, ...categoryFields } = category;
  return { category: categoryFields, products };
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const rows = await prisma.category.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** Used by the /categories index — every category, alphabetical. */
export async function getAllCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

/**
 * Used by the homepage's category chip list — only sub-niche (child) categories,
 * not top-level structural hubs. A parent hub like "Outdoor & Field Gear" has no
 * products of its own (only its children do), so surfacing it directly on the
 * homepage would be a dead-end click; surfacing every top-level category
 * (including ones with no active content batch, like the Home Office niche kept
 * as backup) also mixes active and inactive niches undifferentiated. This
 * naturally shows exactly the categories with real, browsable content: whichever
 * niche(s) currently have an active content push, without hardcoding a niche
 * name here.
 */
export async function getHomepageCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { name: "asc" },
  });
}

/**
 * Used by the homepage's "Featured Comparisons" carousel — real, live products
 * only (seoStatus INDEXABLE), scoped the same way getHomepageCategories() is
 * (sub-niche child categories, not top-level hubs). Currently returns an empty
 * array — nothing in the batch has been promoted to INDEXABLE yet — and callers
 * must render a graceful empty state, not assume this is non-empty.
 */
export async function getFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { seoStatus: "INDEXABLE", category: { parentId: { not: null } } },
    include: { category: true, offers: { include: { merchant: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return products.map((product) => ({ ...product, offers: normalizeOffers(product.offers) }));
}

/** Used by the homepage's featured-guides section — title/path only, no full body. */
export async function getIndexableGuideSummaries() {
  return prisma.guide.findMany({
    where: { seoStatus: "INDEXABLE" },
    select: { slug: true, title: true, canonicalPath: true },
  });
}

// ---------- Comparisons ----------

export interface ResolvedComparison {
  comparison: Awaited<ReturnType<typeof prisma.comparison.findUniqueOrThrow>>;
  products: Product[];
  productOffers: Record<string, ReturnType<typeof normalizeOffers>>;
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

export async function getComparisonBySlug(slug: string): Promise<ResolvedComparison | null> {
  const comparison = await prisma.comparison.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { position: "asc" },
        include: { product: { include: { offers: { include: { merchant: true } } } } },
      },
    },
  });
  if (!comparison) return null;

  const { products: productLinks, ...comparisonFields } = comparison;
  const products = productLinks.map((link) => link.product);
  const productOffers = Object.fromEntries(
    productLinks.map((link) => [link.productId, normalizeOffers(link.product.offers)])
  );

  const existing = await prisma.comparison.findMany({
    where: { slug: { not: slug } },
    select: { slug: true, categoryId: true, products: { select: { productId: true } } },
  });
  const overlapping = findOverlappingIntent(
    { slug: comparisonFields.slug, categoryId: comparisonFields.categoryId, productIds: productLinks.map((l) => l.productId) },
    existing.map((c) => ({
      slug: c.slug,
      categoryId: c.categoryId,
      productIds: c.products.map((p) => p.productId),
    }))
  );

  const editorialSections: EditorialSection[] = [
    { name: "verdict", text: comparisonFields.verdict, required: true },
  ];

  const gateResult = runQualityGate({
    pageType: "compare",
    metaTitle: comparisonFields.metaTitle,
    metaDescription: comparisonFields.metaDescription,
    canonicalPath: comparisonFields.canonicalPath,
    editorialSections,
    referencedProductIds: products.map((p) => p.id),
    productDataValidity: Object.fromEntries(
      products.map((p) => [p.id, isProductDataValid(p.specifications)])
    ),
    offerHealth: Object.values(productOffers).flatMap((offers) =>
      offers.map((o) => ({ offerId: o.id, urlResolves: true }))
    ),
    internalLinkCount: products.length > 0 ? 1 : 0,
    overlappingIntentSlugs: overlapping,
  });

  return {
    comparison: comparisonFields,
    products,
    productOffers,
    gateResult,
    isIndexable: comparison.seoStatus === "INDEXABLE",
  };
}

export async function getAllComparisonSlugs(): Promise<string[]> {
  const rows = await prisma.comparison.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ---------- Guides ----------

export interface ResolvedGuide {
  guide: Awaited<ReturnType<typeof prisma.guide.findUniqueOrThrow>>;
  products: Product[];
  category: Category | null;
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

export async function getGuideBySlug(slug: string): Promise<ResolvedGuide | null> {
  const guide = await prisma.guide.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        orderBy: { position: "asc" },
        include: { product: { include: { offers: { include: { merchant: true } } } } },
      },
    },
  });
  if (!guide) return null;

  const { products: productLinks, category, ...guideFields } = guide;
  const products = productLinks.map((link) => link.product);
  const productOffersById = Object.fromEntries(
    productLinks.map((link) => [link.productId, normalizeOffers(link.product.offers)])
  );

  const editorialSections: EditorialSection[] = [
    { name: "content", text: guideFields.content, required: true },
  ];

  const gateResult = runQualityGate({
    pageType: "guide",
    metaTitle: guideFields.metaTitle,
    metaDescription: guideFields.metaDescription,
    canonicalPath: guideFields.canonicalPath,
    editorialSections,
    referencedProductIds: products.map((p) => p.id),
    productDataValidity: Object.fromEntries(
      products.map((p) => [p.id, isProductDataValid(p.specifications)])
    ),
    offerHealth: Object.values(productOffersById).flatMap((offers) =>
      offers.map((o) => ({ offerId: o.id, urlResolves: true }))
    ),
    internalLinkCount: category ? 1 : 0,
    overlappingIntentSlugs: [],
  });

  return {
    guide: guideFields,
    products,
    category,
    gateResult,
    isIndexable: guide.seoStatus === "INDEXABLE",
  };
}

export async function getAllGuideSlugs(): Promise<string[]> {
  const rows = await prisma.guide.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ---------- Alternatives ----------

export interface ResolvedAlternatives {
  sourceProduct: Product;
  alternatives: Product[];
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

/**
 * "/alternatives/[slug]" is keyed by the SOURCE product's slug — e.g.
 * /alternatives/alpha-electric-standing-desk-48in lists documented alternatives to
 * the Alpha desk. Alternatives come only from the real Product.alternatives
 * self-relation — never inferred/guessed similarity (master brief §26/SEO_STRATEGY.md).
 */
export async function getAlternativesBySlug(slug: string): Promise<ResolvedAlternatives | null> {
  const sourceProduct = await prisma.product.findUnique({
    where: { slug },
    include: { alternatives: true },
  });
  if (!sourceProduct) return null;

  const { alternatives, ...sourceFields } = sourceProduct;

  const editorialSections: EditorialSection[] = [
    // The "alternatives" page type reuses the source product's verdict as its framing
    // editorial content — a real alternatives page would have its own written
    // introduction; this stands in for that until real content exists.
    { name: "verdict", text: sourceFields.verdict, required: true },
  ];

  const gateResult = runQualityGate({
    pageType: "alternatives",
    metaTitle: sourceFields.metaTitle ? `Alternatives to ${sourceFields.name}` : null,
    metaDescription: sourceFields.metaDescription,
    canonicalPath: sourceFields.canonicalPath ? `/alternatives/${sourceFields.slug}` : null,
    editorialSections,
    referencedProductIds: [sourceFields.id, ...alternatives.map((a) => a.id)],
    productDataValidity: Object.fromEntries(
      [sourceFields, ...alternatives].map((p) => [p.id, isProductDataValid(p.specifications)])
    ),
    offerHealth: [],
    internalLinkCount: alternatives.length,
    overlappingIntentSlugs: [],
  });

  return {
    sourceProduct: sourceFields,
    alternatives,
    gateResult,
    // Alternatives pages don't have their own seoStatus (they derive from the source
    // product); indexable only when the source product itself is indexable AND real
    // alternatives exist.
    isIndexable: sourceProduct.seoStatus === "INDEXABLE" && alternatives.length > 0,
  };
}

export async function getAllAlternativesSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { alternatives: { some: {} } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// ---------- Best pages ----------

export interface ResolvedBestPage {
  bestPage: Awaited<ReturnType<typeof prisma.bestPage.findUniqueOrThrow>>;
  products: Product[];
  productOffers: Record<string, ReturnType<typeof normalizeOffers>>;
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

export async function getBestPageBySlug(slug: string): Promise<ResolvedBestPage | null> {
  const bestPage = await prisma.bestPage.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { position: "asc" },
        include: { product: { include: { offers: { include: { merchant: true } } } } },
      },
    },
  });
  if (!bestPage) return null;

  const { products: productLinks, ...bestPageFields } = bestPage;
  const products = productLinks.map((link) => link.product);
  const productOffers = Object.fromEntries(
    productLinks.map((link) => [link.productId, normalizeOffers(link.product.offers)])
  );

  const existing = await prisma.bestPage.findMany({
    where: { slug: { not: slug } },
    select: { slug: true, categoryId: true, products: { select: { productId: true } } },
  });
  const overlapping = findOverlappingIntent(
    { slug: bestPageFields.slug, categoryId: bestPageFields.categoryId, productIds: productLinks.map((l) => l.productId) },
    existing.map((b) => ({
      slug: b.slug,
      categoryId: b.categoryId,
      productIds: b.products.map((p) => p.productId),
    }))
  );

  const editorialSections: EditorialSection[] = [
    { name: "verdict", text: bestPageFields.verdict, required: true },
  ];

  const gateResult = runQualityGate({
    pageType: "best",
    metaTitle: bestPageFields.metaTitle,
    metaDescription: bestPageFields.metaDescription,
    canonicalPath: bestPageFields.canonicalPath,
    editorialSections,
    referencedProductIds: products.map((p) => p.id),
    productDataValidity: Object.fromEntries(
      products.map((p) => [p.id, isProductDataValid(p.specifications)])
    ),
    offerHealth: Object.values(productOffers).flatMap((offers) =>
      offers.map((o) => ({ offerId: o.id, urlResolves: true }))
    ),
    internalLinkCount: products.length > 0 ? 1 : 0,
    overlappingIntentSlugs: overlapping,
  });

  return {
    bestPage: bestPageFields,
    products,
    productOffers,
    gateResult,
    isIndexable: bestPage.seoStatus === "INDEXABLE",
  };
}

export async function getAllBestPageSlugs(): Promise<string[]> {
  const rows = await prisma.bestPage.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ---------- Search (simple substring match over product/guide/comparison titles) ----------

export interface SearchResult {
  type: "product" | "guide" | "comparison" | "best";
  title: string;
  path: string;
  seoStatus: Product["seoStatus"];
}

/**
 * MVP search per SEO_STRATEGY.md/master brief §27 allowance to use Postgres search at
 * MVP scale — this does a simple case-insensitive substring match over titles fetched
 * from the DB; swap for a real `tsvector` query if/when scale requires it. Only ever
 * returns INDEXABLE content — search results are a public surface too.
 */
export async function searchContent(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const [products, guides, comparisons, bestPages] = await Promise.all([
    prisma.product.findMany({ where: { seoStatus: "INDEXABLE" } }),
    prisma.guide.findMany({ where: { seoStatus: "INDEXABLE" } }),
    prisma.comparison.findMany({ where: { seoStatus: "INDEXABLE" } }),
    prisma.bestPage.findMany({ where: { seoStatus: "INDEXABLE" } }),
  ]);

  const results: SearchResult[] = [];

  for (const product of products) {
    if (product.name.toLowerCase().includes(q)) {
      results.push({
        type: "product",
        title: product.name,
        path: product.canonicalPath ?? `/products/${product.slug}`,
        seoStatus: product.seoStatus,
      });
    }
  }

  for (const guide of guides) {
    if (guide.title.toLowerCase().includes(q)) {
      results.push({
        type: "guide",
        title: guide.title,
        path: guide.canonicalPath ?? `/guides/${guide.slug}`,
        seoStatus: guide.seoStatus,
      });
    }
  }

  for (const comparison of comparisons) {
    if (comparison.title.toLowerCase().includes(q)) {
      results.push({
        type: "comparison",
        title: comparison.title,
        path: comparison.canonicalPath ?? `/compare/${comparison.slug}`,
        seoStatus: comparison.seoStatus,
      });
    }
  }

  for (const bestPage of bestPages) {
    if (bestPage.title.toLowerCase().includes(q)) {
      results.push({
        type: "best",
        title: bestPage.title,
        path: bestPage.canonicalPath ?? `/best/${bestPage.slug}`,
        seoStatus: bestPage.seoStatus,
      });
    }
  }

  return results;
}
