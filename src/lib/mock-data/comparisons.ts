/**
 * MOCK DATA — see products.ts header note on the same conventions (small
 * representative set, mixed seoStatus as a deliberate control case).
 */

import type { Comparison } from "@prisma/client";

export interface MockComparison
  extends Omit<Comparison, "createdAt" | "updatedAt"> {
  productIds: string[]; // ordered — mirrors ComparisonProduct.position
}

export const MOCK_COMPARISONS: MockComparison[] = [
  {
    id: "comparison_alpha_vs_beta",
    slug: "alpha-electric-standing-desk-48in-vs-beta-prolift-standing-desk-55in",
    title: "Alpha Electric Standing Desk vs Beta ProLift Standing Desk",
    verdict:
      "Choose the Alpha if you want a steadier lift and don't need more than 48 inches of width; choose the Beta if you're running two monitors and need the extra desk surface more than you need dual-motor stability. Neither is a wrong choice — they're built for slightly different desk setups rather than one being strictly better.",
    categoryId: "category_desks",
    productIds: ["product_standing_desk_alpha", "product_standing_desk_beta"],
    // Deliberately REVIEW, not INDEXABLE: this is the second stage of the pipeline
    // (content complete, awaiting gate + promotion) so the UI/gate flow has a
    // realistic example of a page that is NOT yet live, distinct from the DRAFT
    // products above.
    seoStatus: "REVIEW",
    metaTitle: "Alpha vs Beta Standing Desk — Which Should You Buy?",
    metaDescription:
      "A side-by-side comparison of the Alpha Electric Standing Desk and Beta ProLift Standing Desk on stability, width, and price.",
    canonicalPath:
      "/compare/alpha-electric-standing-desk-48in-vs-beta-prolift-standing-desk-55in",
  },
];
