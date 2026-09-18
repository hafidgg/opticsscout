/**
 * Duplicate/thin-content & cannibalization protection (SEO_STRATEGY.md §5).
 *
 * Computes intent overlap between a candidate page and existing pages so the Quality
 * Gate can hold a new page for manual disambiguation instead of auto-publishing
 * something that competes with existing content.
 */

export interface IntentCandidate {
  slug: string;
  categoryId: string | null;
  productIds: string[];
}

/** Jaccard similarity of two product-id sets — 0 (no overlap) to 1 (identical sets). */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Overlap threshold above which two pages are considered to be targeting materially
 * the same intent. Documented as an experimental default, tunable via config — not a
 * permanent rule (consistent with how ToolVerse's own scoring thresholds are treated).
 */
export const INTENT_OVERLAP_THRESHOLD = 0.6;

/**
 * Returns the slugs of existing pages that overlap the candidate above the threshold,
 * restricted to same-category comparisons (a "best standing desks" page and a "best
 * ergonomic chairs" page sharing zero products isn't cannibalization even if computed
 * naively — scoping to same category avoids false positives).
 */
export function findOverlappingIntent(
  candidate: IntentCandidate,
  existingPages: IntentCandidate[]
): string[] {
  return existingPages
    .filter((existing) => existing.slug !== candidate.slug)
    .filter((existing) => existing.categoryId === candidate.categoryId)
    .filter(
      (existing) =>
        jaccardSimilarity(candidate.productIds, existing.productIds) >=
        INTENT_OVERLAP_THRESHOLD
    )
    .map((existing) => existing.slug);
}
