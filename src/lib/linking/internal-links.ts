/**
 * Internal linking engine foundation (master brief §26, SEO_STRATEGY.md).
 *
 * Resolves semantically relevant relationships — never random links. This module
 * returns *candidate* related links for a given piece of content; it does not render
 * UI itself (see components for that). Each resolver only returns links that are
 * actually meaningful relationships already present in the data model:
 *
 *   Product → Category, Product → Alternatives, Product → Sibling products
 *   (same category), Product → Comparison (that includes it)
 *   Category → Products (same category)
 *
 * Guide↔Product resolvers are deferred until Guide has real (non-mock, INDEXABLE)
 * records — same reasoning as indexable-content.ts: no stub that can't be verified
 * against real data. Comparison↔Product is no longer deferred as of the internal-
 * linking pass (2026-09) — real INDEXABLE comparisons now exist.
 */

import type { Product } from "@prisma/client";

export interface RelatedLink {
  label: string;
  path: string;
  relation: "category" | "alternative" | "sibling" | "comparison";
}

export interface ProductForLinking
  extends Pick<Product, "id" | "slug" | "name" | "categoryId" | "canonicalPath"> {
  alternativeSlugs?: string[];
  alternativeNames?: string[];
}

/**
 * Related links for a single product page: its category hub, any declared
 * alternatives, sibling products in the same category, and the comparison that
 * includes it (if any) — all real, already-modeled relationships (Product.categoryId,
 * Product.alternatives self-relation, Comparison↔Product via ComparisonProduct) —
 * never inferred/guessed similarity.
 */
export function getRelatedLinksForProduct(
  product: ProductForLinking,
  categoryName: string | null,
  categorySlug: string | null,
  siblingProducts: { slug: string; name: string }[] = [],
  comparisonLink: { title: string; path: string } | null = null
): RelatedLink[] {
  const links: RelatedLink[] = [];

  if (categorySlug && categoryName) {
    links.push({
      label: categoryName,
      path: `/categories/${categorySlug}`,
      relation: "category",
    });
  }

  if (product.alternativeSlugs && product.alternativeNames) {
    product.alternativeSlugs.forEach((slug, index) => {
      const name = product.alternativeNames?.[index];
      if (name) {
        links.push({
          label: name,
          path: `/products/${slug}`,
          relation: "alternative",
        });
      }
    });
  }

  siblingProducts.forEach((sibling) => {
    links.push({
      label: sibling.name,
      path: `/products/${sibling.slug}`,
      relation: "sibling",
    });
  });

  if (comparisonLink) {
    links.push({
      label: `Compare: ${comparisonLink.title}`,
      path: comparisonLink.path,
      relation: "comparison",
    });
  }

  return links;
}

/** Minimum internal links a page needs to pass the Quality Gate's link check. */
export const MINIMUM_INTERNAL_LINKS_FOR_GATE = 1;
