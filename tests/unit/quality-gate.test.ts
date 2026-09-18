import { describe, it, expect } from "vitest";
import {
  runQualityGate,
  nextSeoStatus,
  type QualityGateInput,
} from "@/lib/seo/quality-gate";

const LONG_TEXT =
  "This is a substantive editorial paragraph that exceeds the minimum length threshold required by the quality gate. ".repeat(
    3
  );

function baseInput(overrides: Partial<QualityGateInput> = {}): QualityGateInput {
  return {
    pageType: "product",
    metaTitle: "Alpha Standing Desk Review",
    metaDescription: "An in-depth look at the Alpha standing desk.",
    canonicalPath: "/products/alpha-standing-desk",
    editorialSections: [
      { name: "verdict", text: LONG_TEXT, required: true },
      { name: "whoItsFor", text: LONG_TEXT, required: true },
    ],
    referencedProductIds: ["product_alpha"],
    productDataValidity: { product_alpha: true },
    offerHealth: [{ offerId: "offer_1", urlResolves: true }],
    internalLinkCount: 2,
    overlappingIntentSlugs: [],
    ...overrides,
  };
}

describe("runQualityGate", () => {
  it("passes a fully valid product page", () => {
    const result = runQualityGate(baseInput());
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails when editorial content is too short", () => {
    const result = runQualityGate(
      baseInput({
        editorialSections: [
          { name: "verdict", text: "Too short.", required: true },
        ],
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain(
      "hasMinimumEditorialContent"
    );
  });

  it("does not fail on an empty section that isn't required", () => {
    const result = runQualityGate(
      baseInput({
        editorialSections: [
          { name: "verdict", text: LONG_TEXT, required: true },
          { name: "whoShouldAvoid", text: "", required: false },
        ],
      })
    );
    expect(result.passed).toBe(true);
  });

  it("fails on a required section that is present but empty", () => {
    const result = runQualityGate(
      baseInput({
        editorialSections: [
          { name: "verdict", text: LONG_TEXT, required: true },
          { name: "whoItsFor", text: "   ", required: true },
        ],
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasNoEmptySections");
  });

  it("requires at least 2 products for a 'best' page", () => {
    const result = runQualityGate(
      baseInput({
        pageType: "best",
        referencedProductIds: ["product_alpha"],
        productDataValidity: { product_alpha: true },
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain(
      "hasSufficientProductCoverage"
    );
  });

  it("passes a 'best' page with 2+ products and valid data", () => {
    const result = runQualityGate(
      baseInput({
        pageType: "best",
        referencedProductIds: ["product_alpha", "product_beta"],
        productDataValidity: { product_alpha: true, product_beta: true },
      })
    );
    expect(result.passed).toBe(true);
  });

  it("fails when a referenced product has invalid/placeholder data", () => {
    const result = runQualityGate(
      baseInput({
        productDataValidity: { product_alpha: false },
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasValidProductData");
  });

  it("fails when an offer URL is broken", () => {
    const result = runQualityGate(
      baseInput({
        offerHealth: [{ offerId: "offer_1", urlResolves: false }],
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasNoBrokenOffers");
  });

  it("fails when metadata is incomplete", () => {
    const result = runQualityGate(baseInput({ metaTitle: null }));
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasCompleteMetadata");
  });

  it("fails when overlapping intent is detected", () => {
    const result = runQualityGate(
      baseInput({ overlappingIntentSlugs: ["best-standing-desks-2026"] })
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasNoDuplicateIntent");
  });

  it("fails when there are no internal links", () => {
    const result = runQualityGate(baseInput({ internalLinkCount: 0 }));
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.id)).toContain("hasInternalLinks");
  });
});

describe("nextSeoStatus", () => {
  it("advances DRAFT to REVIEW on a passing gate", () => {
    const result = runQualityGate(baseInput());
    expect(nextSeoStatus("DRAFT", result)).toBe("REVIEW");
  });

  it("advances REVIEW to READY on a passing gate", () => {
    const result = runQualityGate(baseInput());
    expect(nextSeoStatus("REVIEW", result)).toBe("READY");
  });

  it("does NOT auto-advance READY to INDEXABLE even on a passing gate", () => {
    const result = runQualityGate(baseInput());
    expect(nextSeoStatus("READY", result)).toBe("READY");
  });

  it("demotes REVIEW to REVIEW (stays) on a failing gate", () => {
    const result = runQualityGate(baseInput({ metaTitle: null }));
    expect(nextSeoStatus("REVIEW", result)).toBe("REVIEW");
  });

  it("demotes READY back to REVIEW when the gate later fails", () => {
    const result = runQualityGate(baseInput({ metaTitle: null }));
    expect(nextSeoStatus("READY", result)).toBe("REVIEW");
  });

  it("demotes INDEXABLE back to REVIEW when the gate later fails", () => {
    const result = runQualityGate(
      baseInput({ offerHealth: [{ offerId: "o1", urlResolves: false }] })
    );
    expect(nextSeoStatus("INDEXABLE", result)).toBe("REVIEW");
  });

  it("never auto-advances ARCHIVED", () => {
    const result = runQualityGate(baseInput());
    expect(nextSeoStatus("ARCHIVED", result)).toBe("ARCHIVED");
  });

  it("never auto-advances NOINDEX", () => {
    const result = runQualityGate(baseInput());
    expect(nextSeoStatus("NOINDEX", result)).toBe("NOINDEX");
  });
});
