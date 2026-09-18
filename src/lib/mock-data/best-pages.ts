/**
 * MOCK DATA — "/best/[slug]" pages. See products.ts header note on conventions.
 *
 * A "best" page is its own content type (master brief §13) even though it shares
 * structure with a Guide — it's a ranked pick list with a verdict, not necessarily
 * long-form narrative content. Backed by its own BestPage model (see schema.prisma)
 * rather than reusing Guide, so the two can diverge in shape.
 */

import type { BestPage } from "@prisma/client";

export interface MockBestPage extends Omit<BestPage, "createdAt" | "updatedAt"> {
  productIds: string[]; // ordered — top pick first, mirrors BestPageProduct.position
}

export const MOCK_BEST_PAGES: MockBestPage[] = [
  {
    id: "best_standing_desks_under_500",
    slug: "standing-desks-under-500",
    title: "Best Standing Desks Under $500",
    intent: "best standing desk under $500",
    verdict:
      "For most home offices under this budget, the Alpha Electric Standing Desk is the strongest pick thanks to its steadier dual-motor lift — the Beta ProLift is worth considering instead only if you specifically need the extra desk surface for a dual-monitor setup and can accept a slightly less stable lift at full height.",
    categoryId: "category_desks",
    productIds: ["product_standing_desk_alpha", "product_standing_desk_beta"],
    // Deliberately DRAFT — this is the fourth pipeline stage shown across the mock
    // dataset (product=INDEXABLE, comparison=REVIEW, guide=READY, best=DRAFT), so the
    // full DRAFT/REVIEW/READY/INDEXABLE spread is represented and testable.
    seoStatus: "DRAFT",
    metaTitle: null,
    metaDescription: null,
    canonicalPath: null,
  },
];
