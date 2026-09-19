import Link from "next/link";
import { formatSpecLabel, formatSpecValue, getSortedSpecKeys } from "@/lib/content/specifications";

export interface ComparisonTableProduct {
  slug: string;
  name: string;
  lowestPrice: number | null;
  currency: string;
  /** True when lowestPrice is a manufacturer MSRP, not a live merchant price. */
  isMsrp: boolean;
  specifications: Record<string, unknown> | null;
  pros: string[];
  cons: string[];
  bestForLabel: string | null;
}

/**
 * Comparison table — the visual "hero" moment for /compare and /best pages (Phase 3
 * design plan). Rows are spec keys present on ANY compared product, so a spec unique
 * to one product still gets its own row rather than being silently dropped; a
 * product missing that key shows "—", never a guessed value (Section 30/37).
 */
export function ComparisonTable({ products }: { products: ComparisonTableProduct[] }) {
  if (products.length === 0) return null;

  const specKeys = getSortedSpecKeys(products.map((p) => p.specifications));

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-paper-raised)]">
            <th className="p-3 text-left font-medium text-[var(--color-muted)]">
              &nbsp;
            </th>
            {products.map((product) => (
              <th key={product.slug} className="p-3 text-left align-top">
                <Link
                  href={`/products/${product.slug}`}
                  className="font-serif text-base text-[var(--color-ink)] hover:underline"
                >
                  {product.name}
                </Link>
                {product.bestForLabel && (
                  <p className="mt-1 text-xs font-medium text-[var(--color-good)]">
                    {product.bestForLabel}
                  </p>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[var(--color-border)]">
            <td className="p-3 text-[var(--color-muted)]">Price</td>
            {products.map((product) => (
              <td key={product.slug} className="p-3 font-medium text-[var(--color-accent)]">
                {product.lowestPrice !== null ? (
                  <>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: product.currency,
                    }).format(product.lowestPrice)}
                    {product.isMsrp && (
                      <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                        MSRP
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </td>
            ))}
          </tr>

          {specKeys.map((key) => (
            <tr key={key} className="border-b border-[var(--color-border)]">
              <td className="p-3 text-[var(--color-muted)]">{formatSpecLabel(key)}</td>
              {products.map((product) => {
                const value = product.specifications?.[key];
                return (
                  <td key={product.slug} className="p-3 text-[var(--color-ink)]">
                    {formatSpecValue(value)}
                  </td>
                );
              })}
            </tr>
          ))}

          <tr className="border-b border-[var(--color-border)]">
            <td className="p-3 align-top text-[var(--color-muted)]">Pros</td>
            {products.map((product) => (
              <td key={product.slug} className="p-3 align-top">
                <ul className="list-inside list-disc text-[var(--color-ink)]">
                  {product.pros.map((pro) => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          <tr>
            <td className="p-3 align-top text-[var(--color-muted)]">Cons</td>
            {products.map((product) => (
              <td key={product.slug} className="p-3 align-top">
                <ul className="list-inside list-disc text-[var(--color-ink)]">
                  {product.cons.map((con) => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {products.some((p) => p.isMsrp) && (
        <p className="border-t border-[var(--color-border)] p-3 text-xs text-[var(--color-muted)]">
          MSRP is the manufacturer&rsquo;s suggested retail price, not a live price —
          check the retailer link for current pricing.
        </p>
      )}
    </div>
  );
}
