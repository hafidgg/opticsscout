/**
 * MOCK DATA — see products.ts header note on the same conventions.
 */

import type { Guide } from "@prisma/client";

export interface MockGuide extends Omit<Guide, "createdAt" | "updatedAt"> {
  productIds: string[]; // ordered — mirrors GuideProduct.position
}

export const MOCK_GUIDES: MockGuide[] = [
  {
    id: "guide_best_standing_desks",
    slug: "best-standing-desks-for-home-offices",
    title: "Best Standing Desks for Home Offices",
    intent: "best standing desk for a home office",
    content:
      "If you're setting up a home office and want to alternate between sitting and standing through the day, the two things that matter most are stability at full height and whether the desk actually fits your space. A wobbly desk at standing height is worse than no standing desk at all, since it makes typing and using a mouse genuinely uncomfortable. We looked at dual-motor and single-motor options in the $300-$500 range and picked the Alpha Electric Standing Desk as the steadiest option for most home office setups, with the wider Beta ProLift as the better pick if you specifically need more surface area for a dual-monitor setup.",
    categoryId: "category_desks",
    productIds: ["product_standing_desk_alpha", "product_standing_desk_beta"],
    // Deliberately READY, not INDEXABLE: content is complete and has passed the gate,
    // but promotion to INDEXABLE is a separate explicit step (see quality-gate.ts —
    // nextSeoStatus never auto-promotes READY -> INDEXABLE). This is the third stage
    // of the pipeline shown across the mock dataset.
    seoStatus: "READY",
    metaTitle: "Best Standing Desks for Home Offices (2026)",
    metaDescription:
      "Our picks for the best standing desks for a home office, based on stability, desk surface, and price.",
    canonicalPath: "/guides/best-standing-desks-for-home-offices",
  },
];
