/**
 * Internal linking engine foundation (master brief §26, SEO_STRATEGY.md).
 *
 * Resolves semantically relevant relationships — never random links. This module
 * returns *candidate* related links for a given piece of content; it does not render
 * UI itself (see components for that). Each resolver only returns links that are
 * actually meaningful relationships already present in the data model:
 *
 *   Product → Category, Product → Alternatives
 *   Category → Products (same category)
 *
 * Guide↔Product and Comparison↔Product resolvers are deferred until Guide/Comparison
 * have real (non-mock) records — same reasoning as indexable-content.ts: no stub that
 * can't be verified against real data.
 */

import type { Product } from "@prisma/client";

export interface RelatedLink {
  label: string;
  path: string;
  relation: "category" | "alternative";
}

export interface ProductForLinking
  extends Pick<Product, "id" | "slug" | "name" | "categoryId" | "canonicalPath"> {
  alternativeSlugs?: string[];
  alternativeNames?: string[];
}

/**
 * Related links for a single product page: its category hub, plus any declared
 * alternatives. Both are real, already-modeled relationships (Product.categoryId,
 * Product.alternatives self-relation) — never inferred/guessed similarity.
 */
export function getRelatedLinksForProduct(
  product: ProductForLinking,
  categoryName: string | null,
  categorySlug: string | null
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

  return links;
}

/** Minimum internal links a page needs to pass the Quality Gate's link check. */
export const MINIMUM_INTERNAL_LINKS_FOR_GATE = 1;
