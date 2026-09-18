import { describe, it, expect } from "vitest";
import {
  getProductBySlug,
  getComparisonBySlug,
  getGuideBySlug,
  getBestPageBySlug,
  getAlternativesBySlug,
  getCategoryBySlug,
  searchContent,
} from "@/lib/content/repository";

/**
 * Integration tests for the content repository — proving the Quality Gate is
 * actually wired into real (seeded) content resolution via Prisma, not just tested
 * in isolation against hand-built inputs (tests/unit/quality-gate.test.ts). This is
 * what makes "every route respects the gate" a verified claim rather than an
 * assertion. Requires the dev database to be migrated and seeded (`npm run db:seed`).
 */

describe("repository x quality gate integration", () => {
  it("the promoted 'alpha' product passes its own gate and is indexable", async () => {
    const resolved = await getProductBySlug("alpha-electric-standing-desk-48in");
    expect(resolved).not.toBeNull();
    expect(resolved!.isIndexable).toBe(true);
    expect(resolved!.gateResult.passed).toBe(true);
    expect(resolved!.gateResult.failures).toHaveLength(0);
  });

  it("the DRAFT 'beta' product is NOT indexable even though it exists", async () => {
    const resolved = await getProductBySlug("beta-prolift-standing-desk-55in");
    expect(resolved).not.toBeNull();
    expect(resolved!.isIndexable).toBe(false);
  });

  it("the DRAFT 'beta' product correctly FAILS the gate (missing verdict/metadata)", async () => {
    const resolved = await getProductBySlug("beta-prolift-standing-desk-55in");
    expect(resolved!.gateResult.passed).toBe(false);
    expect(resolved!.gateResult.failures.length).toBeGreaterThan(0);
  });

  it("an unknown product slug resolves to null", async () => {
    expect(await getProductBySlug("does-not-exist")).toBeNull();
  });

  it("the REVIEW comparison is not indexable, and passes/fails the gate independently of that", async () => {
    const resolved = await getComparisonBySlug(
      "alpha-electric-standing-desk-48in-vs-beta-prolift-standing-desk-55in"
    );
    expect(resolved).not.toBeNull();
    // seoStatus REVIEW means "not live" regardless of gate outcome — this is the
    // strict INDEXABLE-only rule enforced at the repository/route boundary.
    expect(resolved!.isIndexable).toBe(false);
  });

  it("the READY guide is not indexable (READY requires an explicit separate promotion)", async () => {
    const resolved = await getGuideBySlug("best-standing-desks-for-home-offices");
    expect(resolved).not.toBeNull();
    expect(resolved!.isIndexable).toBe(false);
  });

  it("the DRAFT best-page is not indexable", async () => {
    const resolved = await getBestPageBySlug("standing-desks-under-500");
    expect(resolved).not.toBeNull();
    expect(resolved!.isIndexable).toBe(false);
  });

  it("alternatives page is indexable only when the source product is indexable AND has alternatives", async () => {
    const resolved = await getAlternativesBySlug("alpha-electric-standing-desk-48in");
    expect(resolved).not.toBeNull();
    expect(resolved!.alternatives.length).toBeGreaterThan(0);
    expect(resolved!.isIndexable).toBe(true);
  });

  it("a product with no declared alternatives resolves but is not indexable via /alternatives", async () => {
    const resolved = await getAlternativesBySlug("beta-prolift-standing-desk-55in");
    expect(resolved).not.toBeNull();
    expect(resolved!.alternatives).toHaveLength(0);
    expect(resolved!.isIndexable).toBe(false);
  });

  it("category resolution returns only products that structurally belong to it", async () => {
    const resolved = await getCategoryBySlug("desks");
    expect(resolved).not.toBeNull();
    expect(resolved!.products.every((p) => p.categoryId === resolved!.category.id)).toBe(
      true
    );
  });

  it("search only ever returns INDEXABLE content, never DRAFT/REVIEW/READY", async () => {
    // "Standing Desk" matches both the INDEXABLE alpha product AND the DRAFT beta
    // product's name — proving the filter, not just an absence of matches.
    const results = await searchContent("Standing Desk");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.seoStatus === "INDEXABLE")).toBe(true);
    expect(results.some((r) => r.title.includes("Alpha"))).toBe(true);
    expect(results.some((r) => r.title.includes("Beta"))).toBe(false);
  });

  it("search returns nothing for an empty query", async () => {
    expect(await searchContent("")).toEqual([]);
    expect(await searchContent("   ")).toEqual([]);
  });
});
