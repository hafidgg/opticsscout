/**
 * Shared spec-table formatting, used by both the single-product specifications
 * section (products/[slug]) and the multi-product ComparisonTable — kept in one
 * place so the two never drift into inconsistent label/value formatting.
 */

/** camelCase -> Title Case With Spaces, e.g. "weightCapacityLbs" -> "Weight Capacity Lbs" */
export function formatSpecLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function formatSpecValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(" – ");
  return String(value);
}

/**
 * Spec keys across one or more products, sorted alphabetically rather than relying on
 * object key order: Postgres's jsonb column does not preserve the original authoring
 * order of a JSON object's keys (it reorders by key length, then alphabetically), so
 * insertion order can't be relied on for a stable, predictable row order here.
 */
export function getSortedSpecKeys(
  specifications: (Record<string, unknown> | null)[]
): string[] {
  return Array.from(
    new Set(specifications.flatMap((s) => (s ? Object.keys(s) : [])))
  ).sort();
}
