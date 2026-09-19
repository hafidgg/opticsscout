import { formatSpecLabel, formatSpecValue, getSortedSpecKeys } from "@/lib/content/specifications";

export interface SpecSourceInfo {
  /** The most common source name backing these specs, e.g. "Vortex Optics official
   *  product page" — never invented, pulled directly from stored SourceRecord rows. */
  source: string;
  /** Most recent SourceRecord.retrievedAt among the records that back a spec field on
   *  this product — never a fabricated/current date. */
  lastVerified: Date;
}

/**
 * Single-product specifications table (products/[slug]) — same key formatting as
 * ComparisonTable, just one column. Only renders keys actually present in
 * `specifications`; a missing value renders "—", never a guess (Section 30/37).
 */
export function ProductSpecifications({
  specifications,
  sourceInfo,
}: {
  specifications: Record<string, unknown> | null;
  sourceInfo: SpecSourceInfo | null;
}) {
  const specKeys = getSortedSpecKeys([specifications]);
  if (specKeys.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-serif text-lg text-[var(--color-ink)]">Specifications</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-[var(--color-border)]">
        <dl className="divide-y divide-[var(--color-border)]">
          {specKeys.map((key) => (
            <div key={key} className="flex justify-between gap-4 p-3 text-sm">
              <dt className="text-[var(--color-muted)]">{formatSpecLabel(key)}</dt>
              <dd className="text-right text-[var(--color-ink)]">
                {formatSpecValue(specifications?.[key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {sourceInfo && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Source: {sourceInfo.source} — Last verified:{" "}
          {sourceInfo.lastVerified.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
