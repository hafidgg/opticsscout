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
  it("a real INDEXABLE product passes its own gate", async () => {
    // Was "alpha-electric-standing-desk-48in" — deleted from production in an
    // earlier pre-launch-audit session (see TODO.md); swapped for a real, currently
    // live optics product so this test reflects actual production data again.
    const resolved = await getProductBySlug("vortex-diamondback-hd-8x42");
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

  it("a comparison's isIndexable strictly mirrors its own seoStatus, not the gate result", async () => {
    // Was a test against a REVIEW-status comparison ("alpha-vs-beta"), which was
    // deleted from production alongside the alpha product (see TODO.md) — no
    // REVIEW-status comparison currently exists to test that branch against real
    // data. This keeps the same underlying assertion (isIndexable is strictly
    // seoStatus-driven, per the repository module's own header comment) against a
    // real, currently INDEXABLE comparison instead.
    const resolved = await getComparisonBySlug(
      "vortex-diamondback-hd-8x42-vs-nikon-monarch-m5-8x42"
    );
    expect(resolved).not.toBeNull();
    expect(resolved!.isIndexable).toBe(resolved!.comparison.seoStatus === "INDEXABLE");
    expect(resolved!.isIndexable).toBe(true);
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

  // The "has real alternatives -> indexable" positive-path test that used to live
  // here (against "alpha-electric-standing-desk-48in", which had a declared
  // alternative in Beta) is currently untestable against real data: the Alpha
  // product was deleted from production and no product currently has a declared
  // alternative (`_ProductAlternatives` is empty) — see TODO.md. Not restoring this
  // coverage with fabricated alternatives data; the negative path below still
  // covers the "no alternatives -> not indexable" half of the rule.

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
    // "Vortex" matches multiple real INDEXABLE optics products AND products that
    // reference "Standing Desk" now only include the DRAFT beta product (the
    // INDEXABLE alpha product this test used to check against was deleted from
    // production — see TODO.md) — so this now proves the filter using "Vortex"
    // (present) vs. confirming "Standing Desk" alone returns nothing, since the
    // only real product matching that name is DRAFT.
    const results = await searchContent("Vortex");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.seoStatus === "INDEXABLE")).toBe(true);
    expect(results.some((r) => r.title.includes("Vortex"))).toBe(true);

    const deskResults = await searchContent("Standing Desk");
    expect(deskResults.some((r) => r.title.includes("Beta"))).toBe(false);
  });

  it("search returns nothing for an empty query", async () => {
    expect(await searchContent("")).toEqual([]);
    expect(await searchContent("   ")).toEqual([]);
  });
});
