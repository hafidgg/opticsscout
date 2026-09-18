/**
 * MOCK DATA — for local development and seeding only. Not real merchant/product data.
 *
 * Small, representative set (3 products) per Phase 3 instructions — not hundreds or
 * thousands. Specifications are illustrative/plausible for the category, not sourced
 * from any real listing (Section 37: no fake data presented as real). rating/
 * reviewCount are null unless explicitly noted otherwise below.
 *
 * seoStatus is intentionally MIXED across these three records:
 *   - "alpha" is "INDEXABLE" — this is the one deliberately-promoted example used to
 *     prove the full Quality Gate -> metadata -> structured data -> render pipeline
 *     works end-to-end. Its editorial content is long enough and complete enough to
 *     actually pass every gate check (verified by tests).
 *   - "beta" and "gamma" are left at "DRAFT" deliberately, to prove the gate/sitemap
 *     continues to correctly exclude non-promoted content even as the dataset grows.
 *     This is NOT "we forgot to finish them" - it's a control case.
 */

import type { Prisma, Product } from "@prisma/client";

type MockProduct = Omit<
  Product,
  "createdAt" | "updatedAt" | "categoryId" | "rating" | "reviewCount" | "specifications"
> & {
  rating: number | null;
  reviewCount: number | null;
  categoryId: string;
  // Every mock product has real specification data — narrower than Product's
  // Prisma.JsonValue (which includes null) so this plugs directly into
  // Prisma's *CreateInput without a JsonNull sentinel dance in seed.ts.
  specifications: Prisma.InputJsonValue;
  /** Mirrors the Product.alternatives self-relation — ids of other MockProducts this
   *  one is a documented alternative to/for. Real, modeled relationship (not inferred
   *  similarity) — see lib/linking/internal-links.ts. */
  alternativeProductIds?: string[];
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "product_standing_desk_alpha",
    name: "Alpha Electric Standing Desk 48in",
    slug: "alpha-electric-standing-desk-48in",
    brand: "Alpha Desks",
    description:
      "A dual-motor electric standing desk with a 48-inch bamboo top, memory height presets, and a stated 220lb weight capacity. Built for people who switch between sitting and standing several times a day and want the transition to be quiet and stable rather than an afterthought.",
    shortDescription: "Dual-motor electric standing desk, 48in bamboo top.",
    categoryId: "category_desks",
    images: [],
    specifications: {
      widthIn: 48,
      depthIn: 24,
      heightRangeIn: [28, 48],
      weightCapacityLbs: 220,
      motorType: "dual",
      material: "bamboo",
    },
    features: ["Memory height presets", "Anti-collision sensor", "Cable management tray"],
    pros: ["Sturdy at full height", "Quiet dual motors"],
    cons: ["Assembly takes ~45 minutes", "No USB passthrough in base model"],
    whoItsFor:
      "People who want a stable, quiet sit-stand desk for a home office and don't need a desk wider than 48 inches. The dual-motor lift stays noticeably steadier at full extension than single-motor competitors in this size range, which matters if you keep a monitor arm or a heavier display on top.",
    whoShouldAvoid:
      "Buyers needing a desk under 42in wide for a small nook, or anyone planning to mount very heavy dual-monitor arms near the 220lb capacity ceiling -- the wider Beta desk below has more headroom for that specific case.",
    verdict:
      "A solid, no-surprises pick if your desk footprint fits 48 inches and you value a stable lift over maximum surface area. The dual motors are the main reason to choose this over a similarly priced single-motor desk: they hold steady under load instead of wobbling at full height, which is the complaint we hear most often about cheaper single-motor alternatives.",
    seoStatus: "INDEXABLE",
    metaTitle: "Alpha Electric Standing Desk 48in — Specs, Price, and Verdict",
    metaDescription:
      "A close look at the Alpha Electric Standing Desk: dual-motor stability, 220lb capacity, and who it's actually a good fit for.",
    canonicalPath: "/products/alpha-electric-standing-desk-48in",
    rating: null,
    reviewCount: null,
    alternativeProductIds: ["product_standing_desk_beta"],
  },
  {
    id: "product_standing_desk_beta",
    name: "Beta ProLift Standing Desk 55in",
    slug: "beta-prolift-standing-desk-55in",
    brand: "Beta Office",
    description:
      "A single-motor standing desk with a larger 55-inch laminate top aimed at dual-monitor setups, with a stated 180lb weight capacity.",
    shortDescription: "Single-motor standing desk, 55in laminate top.",
    categoryId: "category_desks",
    images: [],
    specifications: {
      widthIn: 55,
      depthIn: 28,
      heightRangeIn: [29, 47],
      weightCapacityLbs: 180,
      motorType: "single",
      material: "laminate",
    },
    features: ["Wider top for dual monitors", "Built-in USB-A/C ports"],
    pros: ["More desktop space", "Built-in charging ports"],
    cons: ["Single motor lifts slightly slower", "Lower weight capacity than dual-motor options"],
    whoItsFor: "People running a dual-monitor setup who want more desk surface.",
    whoShouldAvoid:
      "Buyers with very heavy monitor arms or multiple large displays near 180lbs combined.",
    verdict: null,
    // Deliberately DRAFT -- editorial verdict not yet written, so this is a valid
    // control case for "gate correctly withholds an incomplete page."
    seoStatus: "DRAFT",
    metaTitle: null,
    metaDescription: null,
    canonicalPath: null,
    rating: null,
    reviewCount: null,
  },
  {
    id: "product_ergo_chair_gamma",
    name: "Gamma Mesh Ergonomic Chair",
    slug: "gamma-mesh-ergonomic-chair",
    brand: "Gamma Seating",
    description:
      "A mesh-back ergonomic office chair with adjustable lumbar support, 4D armrests, and a stated 300lb weight rating.",
    shortDescription: "Mesh-back ergonomic chair with adjustable lumbar support.",
    categoryId: "category_chairs",
    images: [],
    specifications: {
      weightCapacityLbs: 300,
      seatMaterial: "mesh",
      armrestType: "4D adjustable",
      lumbarSupport: "adjustable",
    },
    features: ["4D adjustable armrests", "Adjustable lumbar support", "Reclining tilt lock"],
    pros: ["Breathable mesh back", "Wide adjustability range"],
    cons: ["Firmer seat cushion than some competitors"],
    whoItsFor: "People who sit for long stretches and want adjustable lumbar support.",
    whoShouldAvoid: "Buyers who prefer a softer, padded (non-mesh) seat.",
    verdict: null,
    seoStatus: "DRAFT",
    metaTitle: null,
    metaDescription: null,
    canonicalPath: null,
    rating: null,
    reviewCount: null,
  },
];
