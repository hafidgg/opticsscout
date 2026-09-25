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

/**
 * The single definition of "publicly visible offer" — active on both the offer
 * itself and its merchant. Every place that fetches offers for public rendering
 * (product pages, comparisons, guides, best pages, the homepage carousel, and the
 * affiliate offer service below) uses this same filter, so "inactive offers never
 * render" is true by construction rather than by convention.
 */
const ACTIVE_OFFER_FILTER = {
  active: true,
  merchant: { active: true },
  // Defensive: a row with an empty/blank url is never a valid, clickable CTA — treat
  // it the same as an inactive offer rather than rendering a dead link.
  url: { not: "" },
} as const;

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

/** The most common source name + most recent retrievedAt among a product's
 *  SourceRecord rows that actually back a specification field (i.e. `field` matches a
 *  key present in `specifications`) — never invented, and never counting unrelated
 *  SourceRecords (e.g. an offer-URL fix) as if they verified the specs. Null when no
 *  spec-backing SourceRecord exists yet. Some existing rows store `field` as a single
 *  comma-separated list (e.g. "rangeDeerYds, weightOz, msrpUsd") rather than one row
 *  per field — handled by splitting on "," rather than requiring an exact match. */
function summarizeSpecSources(
  specifications: unknown,
  sourceRecords: { source: string; field: string; retrievedAt: Date }[]
): { source: string; lastVerified: Date } | null {
  const specKeys =
    specifications && typeof specifications === "object" && !Array.isArray(specifications)
      ? new Set(Object.keys(specifications as object))
      : new Set<string>();

  const relevant = sourceRecords.filter((r) =>
    r.field.split(",").some((f) => specKeys.has(f.trim()))
  );
  if (relevant.length === 0) return null;

  const counts = new Map<string, number>();
  for (const r of relevant) counts.set(r.source, (counts.get(r.source) ?? 0) + 1);
  const source = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const lastVerified = relevant.reduce(
    (latest, r) => (r.retrievedAt > latest ? r.retrievedAt : latest),
    relevant[0].retrievedAt
  );

  return { source, lastVerified };
}

export interface ResolvedProduct {
  product: Product;
  category: Category | null;
  offers: ReturnType<typeof normalizeOffers>;
  gateResult: QualityGateResult;
  /** The strict viewer-facing decision — see module header. */
  isIndexable: boolean;
  specSourceInfo: { source: string; lastVerified: Date } | null;
  /** Other INDEXABLE products in the same category (real Category relation, not the
   *  separate/unused Product.alternatives self-relation) — e.g. the Nikon Monarch M5
   *  sibling for the Vortex Diamondback HD 8x42, both in Birding Optics. */
  siblingProducts: Pick<Product, "slug" | "name">[];
  /** The INDEXABLE comparison that includes this product, if one exists. At most one is
   *  expected at current content scale (one comparison per sub-category, 2 products
   *  each) — findFirst is intentional, not a shortcut around a real multi-match case. */
  comparisonLink: { title: string; path: string } | null;
}

export async function getProductBySlug(slug: string): Promise<ResolvedProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      offers: { where: ACTIVE_OFFER_FILTER, include: { merchant: true } },
      sourceRecords: { select: { source: true, field: true, retrievedAt: true } },
    },
  });
  if (!product) return null;

  const { category, offers: rawOffers, sourceRecords, ...productFields } = product;
  const offers = normalizeOffers(rawOffers);
  const specSourceInfo = summarizeSpecSources(productFields.specifications, sourceRecords);

  const [siblingProducts, comparison] = await Promise.all([
    productFields.categoryId
      ? prisma.product.findMany({
          where: {
            categoryId: productFields.categoryId,
            seoStatus: "INDEXABLE",
            id: { not: productFields.id },
          },
          select: { slug: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.comparison.findFirst({
      where: { seoStatus: "INDEXABLE", products: { some: { productId: productFields.id } } },
      select: { title: true, slug: true, canonicalPath: true },
    }),
  ]);
  const comparisonLink = comparison
    ? { title: comparison.title, path: comparison.canonicalPath ?? `/compare/${comparison.slug}` }
    : null;

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
    specSourceInfo,
    siblingProducts,
    comparisonLink,
  };
}

export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ---------- Affiliate Offers ----------
//
// Small, focused fetch points for offer data specifically — distinct from
// getProductBySlug() above (which already returns active-only offers as part of a
// full product page load). These exist for callers that need offer data without
// pulling a whole product record, and to give the "active vs. all" distinction a
// single, explicit, reusable home rather than every caller re-deriving it.

/** Every offer for a product, active or not — e.g. for an eventual admin/audit view.
 *  Never used for public rendering; use getActiveAffiliateOffers() for that. */
export async function getAffiliateOffers(productId: string) {
  const offers = await prisma.productOffer.findMany({
    where: { productId },
    include: { merchant: true },
    orderBy: { createdAt: "asc" },
  });
  return normalizeOffers(offers);
}

/** Only offers safe to show publicly — same ACTIVE_OFFER_FILTER every public page
 *  query uses. This is what WhereToBuy/ComparisonTable/JSON-LD should be fed. */
export async function getActiveAffiliateOffers(productId: string) {
  const offers = await prisma.productOffer.findMany({
    where: { productId, ...ACTIVE_OFFER_FILTER },
    include: { merchant: true },
    orderBy: { createdAt: "asc" },
  });
  return normalizeOffers(offers);
}

/** A single product's offer from one specific merchant (by Merchant.slug, e.g.
 *  "amazon" — the stable, human-meaningful identifier, not the internal cuid id).
 *  Returns null if that product has no offer from that merchant, or it isn't
 *  currently active. */
export async function getAffiliateOfferByMerchant(productId: string, merchantSlug: string) {
  const offer = await prisma.productOffer.findFirst({
    where: { productId, ...ACTIVE_OFFER_FILTER, merchant: { slug: merchantSlug, active: true } },
    include: { merchant: true },
  });
  return offer ? normalizeOffers([offer])[0] : null;
}

// ---------- Categories ----------

export interface ResolvedCategory {
  category: Category;
  products: Product[];
  /** Child categories (e.g. Birding Optics/Spotting Scopes/Rangefinders for the
   *  Outdoor & Field Gear parent hub) — empty for a category with no children, which
   *  is every current sub-category and the standalone Home Office ones. */
  childCategories: Category[];
  /** Other categories sharing this one's parent (e.g. Spotting Scopes and Rangefinders
   *  when viewing Birding Optics) — empty for a top-level category or one with no
   *  siblings. Used for a lightweight "explore other outdoor optics" cross-link. */
  siblingCategories: Category[];
  /** INDEXABLE comparisons whose categoryId is this category — real existing
   *  Category.comparisons relation, previously fetched nowhere in the app. */
  comparisons: { title: string; path: string }[];
  /** INDEXABLE "/best/" pages whose categoryId is this category — same idea as
   *  comparisons above, via the existing Category.bestPages relation. */
  bestPages: { title: string; path: string }[];
}

export async function getCategoryBySlug(slug: string): Promise<ResolvedCategory | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { products: true, children: { orderBy: { name: "asc" } } },
  });
  if (!category) return null;

  const { products, children: childCategories, ...categoryFields } = category;

  const [siblingCategories, comparisons, bestPages] = await Promise.all([
    categoryFields.parentId
      ? prisma.category.findMany({
          where: { parentId: categoryFields.parentId, id: { not: categoryFields.id } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.comparison.findMany({
      where: { categoryId: categoryFields.id, seoStatus: "INDEXABLE" },
      select: { title: true, slug: true, canonicalPath: true },
    }),
    // Same INDEXABLE-only rule as comparisons above — a DRAFT BestPage (like the new
    // "Best Spotting Scopes" page while it's under review) simply doesn't appear here
    // yet. No extra check needed once it's promoted; this query already covers it.
    prisma.bestPage.findMany({
      where: { categoryId: categoryFields.id, seoStatus: "INDEXABLE" },
      select: { title: true, slug: true, canonicalPath: true },
    }),
  ]);

  return {
    category: categoryFields,
    products,
    childCategories,
    siblingCategories,
    comparisons: comparisons.map((c) => ({
      title: c.title,
      path: c.canonicalPath ?? `/compare/${c.slug}`,
    })),
    bestPages: bestPages.map((b) => ({
      title: b.title,
      path: b.canonicalPath ?? `/best/${b.slug}`,
    })),
  };
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
    include: { category: true, offers: { where: ACTIVE_OFFER_FILTER, include: { merchant: true } } },
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
  category: Category | null;
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

export async function getComparisonBySlug(slug: string): Promise<ResolvedComparison | null> {
  const comparison = await prisma.comparison.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        orderBy: { position: "asc" },
        include: { product: { include: { offers: { where: ACTIVE_OFFER_FILTER, include: { merchant: true } } } } },
      },
    },
  });
  if (!comparison) return null;

  const { products: productLinks, category, ...comparisonFields } = comparison;
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
    category,
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
        include: { product: { include: { offers: { where: ACTIVE_OFFER_FILTER, include: { merchant: true } } } } },
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
  category: Category | null;
  gateResult: QualityGateResult;
  isIndexable: boolean;
}

export async function getBestPageBySlug(slug: string): Promise<ResolvedBestPage | null> {
  const bestPage = await prisma.bestPage.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        orderBy: { position: "asc" },
        include: { product: { include: { offers: { where: ACTIVE_OFFER_FILTER, include: { merchant: true } } } } },
      },
    },
  });
  if (!bestPage) return null;

  const { products: productLinks, category, ...bestPageFields } = bestPage;
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
    category,
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
 * Matches when `q` (or its naive singular, stripping a trailing "s") appears as a
 * substring of `text` — handles the common case of a plural query against singular
 * product copy (e.g. query "binoculars" against shortDescription's "binocular")
 * without pulling in a real stemmer/tokenizer for an MVP-scale search.
 */
function matchesQuery(text: string, q: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes(q)) return true;
  if (q.length > 3 && q.endsWith("s") && lower.includes(q.slice(0, -1))) return true;
  return false;
}

/**
 * MVP search per SEO_STRATEGY.md/master brief §27 allowance to use Postgres search at
 * MVP scale — this does a simple case-insensitive substring match over titles (and,
 * for products, brand/shortDescription too — see matchesQuery) fetched from the DB;
 * swap for a real `tsvector` query if/when scale requires it. Only ever returns
 * INDEXABLE content — search results are a public surface too.
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
    const corpus = [product.name, product.brand, product.shortDescription]
      .filter((v): v is string => Boolean(v))
      .join(" ");
    if (matchesQuery(corpus, q)) {
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
