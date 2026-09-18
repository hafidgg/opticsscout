import { describe, it, expect } from "vitest";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo/structured-data";

describe("buildProductJsonLd", () => {
  const baseProduct = {
    name: "Alpha Standing Desk",
    slug: "alpha-standing-desk",
    description: "A description.",
    shortDescription: "Short description.",
    images: [] as string[],
    brand: "Alpha Desks",
    canonicalPath: "/products/alpha-standing-desk",
  };

  it("never emits aggregateRating when rating is null", () => {
    const node = buildProductJsonLd({
      product: { ...baseProduct, rating: null, reviewCount: null },
      offers: [],
    });
    expect(node.aggregateRating).toBeUndefined();
  });

  it("never emits aggregateRating when reviewCount is null even if rating is set", () => {
    const node = buildProductJsonLd({
      product: { ...baseProduct, rating: 4.2, reviewCount: null },
      offers: [],
    });
    expect(node.aggregateRating).toBeUndefined();
  });

  it("never emits aggregateRating when reviewCount is zero", () => {
    const node = buildProductJsonLd({
      product: { ...baseProduct, rating: 4.2, reviewCount: 0 },
      offers: [],
    });
    expect(node.aggregateRating).toBeUndefined();
  });

  it("emits aggregateRating only when both rating and reviewCount are real", () => {
    const node = buildProductJsonLd({
      product: { ...baseProduct, rating: 4.5, reviewCount: 128 },
      offers: [],
    });
    expect(node.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 128,
    });
  });

  it("maps offers with correct schema.org availability values", () => {
    const node = buildProductJsonLd({
      product: { ...baseProduct, rating: null, reviewCount: null },
      offers: [
        {
          price: 399,
          currency: "USD",
          availability: "IN_STOCK",
          url: "https://example.com/offer",
          merchant: { name: "Amazon" },
        },
      ],
    });
    expect(node.offers).toEqual([
      {
        "@type": "Offer",
        price: 399,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://example.com/offer",
        seller: { "@type": "Organization", name: "Amazon" },
      },
    ]);
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("builds a positioned ListItem for each segment", () => {
    const node = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Desks", path: "/categories/desks" },
    ]);
    expect(node["@type"]).toBe("BreadcrumbList");
    expect(node.itemListElement).toHaveLength(2);
    expect((node.itemListElement[0] as { position: number }).position).toBe(1);
    expect((node.itemListElement[1] as { position: number }).position).toBe(2);
  });
});

describe("buildFaqJsonLd", () => {
  it("builds a Question/Answer pair per item", () => {
    const node = buildFaqJsonLd([
      { question: "Is X good?", answer: "Yes, for most people." },
    ]);
    expect(node["@type"]).toBe("FAQPage");
    expect(node.mainEntity).toHaveLength(1);
  });

  it("returns an empty mainEntity for an empty list rather than inventing questions", () => {
    const node = buildFaqJsonLd([]);
    expect(node.mainEntity).toEqual([]);
  });
});
