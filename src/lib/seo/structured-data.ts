/**
 * Structured data (JSON-LD) builders (SEO_STRATEGY.md §3, master brief §12).
 *
 * Every builder here takes strongly-typed, already-validated data — never freeform
 * strings assembled ad hoc — so emitted JSON-LD always matches real DB content.
 * No Review/AggregateRating schema is ever built unless rating/reviewCount are
 * non-null (Section 12: never fabricate ratings).
 */

import type { Product, ProductOffer, Merchant } from "@prisma/client";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export interface JsonLdProductInput {
  product: Pick<
    Product,
    | "name"
    | "slug"
    | "description"
    | "shortDescription"
    | "images"
    | "brand"
    | "rating"
    | "reviewCount"
    | "canonicalPath"
  >;
  offers: (Pick<ProductOffer, "currency" | "availability" | "url"> & {
    // Decimal is converted to a plain number by the caller (repository.ts) before
    // this builder ever sees it — JSON-LD needs a plain numeric/undefined value.
    price: number | null;
    merchant: Pick<Merchant, "name">;
  })[];
}

const availabilityMap: Record<string, string> = {
  IN_STOCK: "https://schema.org/InStock",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  DISCONTINUED: "https://schema.org/Discontinued",
  UNKNOWN: "https://schema.org/InStoreOnly", // closest neutral schema.org value; never
  // fabricated as InStock when we genuinely don't know.
};

/**
 * Builds a schema.org Product node. Only includes an `aggregateRating` block when
 * rating AND reviewCount are both present and non-null — never invented (Section 37).
 */
export function buildProductJsonLd(input: JsonLdProductInput) {
  const siteUrl = getSiteUrl();
  const { product, offers } = input;

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    image: product.images.length > 0 ? product.images : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    url: `${siteUrl}${product.canonicalPath ?? `/products/${product.slug}`}`,
  };

  if (offers.length > 0) {
    node.offers = offers.map((offer) => ({
      "@type": "Offer",
      price: offer.price ?? undefined,
      priceCurrency: offer.currency,
      availability: availabilityMap[offer.availability],
      url: offer.url,
      seller: { "@type": "Organization", name: offer.merchant.name },
    }));
  }

  if (
    typeof product.rating === "number" &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0
  ) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return node;
}

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(segments: BreadcrumbSegment[]) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: segments.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: segment.name,
      item: `${siteUrl}${segment.path}`,
    })),
  };
}

export interface JsonLdArticleInput {
  title: string;
  description: string | null | undefined;
  canonicalPath: string | null | undefined;
  datePublished: Date;
  dateModified: Date;
}

export function buildArticleJsonLd(input: JsonLdArticleInput) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description || undefined,
    url: input.canonicalPath ? `${siteUrl}${input.canonicalPath}` : undefined,
    datePublished: input.datePublished.toISOString(),
    dateModified: input.dateModified.toISOString(),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Only call this when the guide/page has genuine, non-padded FAQ content — the master
 * brief explicitly scopes FAQPage schema to cases where it's "legitimately applicable"
 * (Section 12). Never generate filler questions just to qualify for the schema.
 */
export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
