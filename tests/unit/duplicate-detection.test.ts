import { describe, it, expect } from "vitest";
import { findOverlappingIntent } from "@/lib/seo/duplicate-detection";

describe("findOverlappingIntent", () => {
  it("flags a page with near-identical product set in the same category", () => {
    const candidate = {
      slug: "best-standing-desks-under-400",
      categoryId: "category_desks",
      productIds: ["p1", "p2", "p3"],
    };
    const existing = [
      {
        slug: "best-standing-desks-2026",
        categoryId: "category_desks",
        productIds: ["p1", "p2", "p3", "p4"],
      },
    ];

    expect(findOverlappingIntent(candidate, existing)).toEqual([
      "best-standing-desks-2026",
    ]);
  });

  it("does not flag pages in different categories even with identical product ids", () => {
    const candidate = {
      slug: "best-desks",
      categoryId: "category_desks",
      productIds: ["p1", "p2"],
    };
    const existing = [
      {
        slug: "best-chairs",
        categoryId: "category_chairs",
        productIds: ["p1", "p2"],
      },
    ];

    expect(findOverlappingIntent(candidate, existing)).toEqual([]);
  });

  it("does not flag low-overlap pages in the same category", () => {
    const candidate = {
      slug: "best-desks-for-small-rooms",
      categoryId: "category_desks",
      productIds: ["p1"],
    };
    const existing = [
      {
        slug: "best-desks-overall",
        categoryId: "category_desks",
        productIds: ["p2", "p3", "p4", "p5"],
      },
    ];

    expect(findOverlappingIntent(candidate, existing)).toEqual([]);
  });

  it("excludes the candidate's own slug from comparison", () => {
    const candidate = {
      slug: "best-desks",
      categoryId: "category_desks",
      productIds: ["p1", "p2"],
    };
    const existing = [candidate];

    expect(findOverlappingIntent(candidate, existing)).toEqual([]);
  });
});
