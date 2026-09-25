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

const availabilityMap: Record<string, string | undefined> = {
  IN_STOCK: "https://schema.org/InStock",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  DISCONTINUED: "https://schema.org/Discontinued",
  // No UNKNOWN entry — Google's own structured-data guidance is to omit `availability`
  // entirely when it's genuinely not known, rather than assert a specific value.
  // This used to map to "https://schema.org/InStoreOnly", which is factually wrong
  // for every offer we have (none are in-person/physical-store purchases) — found
  // during the 2026-09 SEO structured-data audit.
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

  // schema.org/Google requires a valid Offer to have a price — an offer with no
  // verified price (e.g. the Nikon Monarch M5, which has no sourced price at all)
  // can't honestly satisfy that, so it's left out of structured data entirely rather
  // than emitted as an incomplete/invalid Offer node. Found during the 2026-09 SEO
  // structured-data audit — WhereToBuy already handles a priceless offer gracefully
  // on the visible page; this just brings the JSON-LD in line with the same rule.
  const pricedOffers = offers.filter((offer) => offer.price !== null);
  if (pricedOffers.length > 0) {
    node.offers = pricedOffers.map((offer) => ({
      "@type": "Offer",
      price: offer.price,
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

/**
 * Site-wide Organization + WebSite schema, rendered once in the root layout — every
 * other JSON-LD builder here is per-page content; this one is the entity/brand-level
 * schema Google generally expects a real site to carry regardless of what page it's
 * on. Deliberately minimal and 100% real: just the actual name and URL, no `logo`
 * (no real logo image exists yet — omitted rather than pointing at a placeholder) and
 * no `sameAs` social links (none exist yet either). The `SearchAction` is genuine:
 * `/search?q={query}` is a real, working search route.
 */
export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpticsScout",
    url: siteUrl,
  };
}

export function buildWebSiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OpticsScout",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
