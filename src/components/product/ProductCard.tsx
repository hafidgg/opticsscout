import Link from "next/link";

export interface ProductCardData {
  slug: string;
  name: string;
  shortDescription: string | null;
  brand: string | null;
  lowestPrice: number | null;
  currency: string;
  /** True when lowestPrice is a manufacturer MSRP, not a live merchant price. */
  isMsrp: boolean;
  merchantCount: number;
  categoryLabel: string | null;
}

/**
 * Information-dense product card — deliberately not the oversized SaaS-card
 * treatment (see Phase 3 design plan): name, one-line spec/description, price, and a
 * merchant-count signal, all visible without hover states doing the work.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4 transition hover:border-[var(--color-ink)]"
    >
      <div className="flex items-start justify-between gap-2">
        {product.categoryLabel && (
          <span className="text-xs text-[var(--color-muted)]">
            {product.categoryLabel}
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg leading-snug text-[var(--color-ink)] group-hover:underline">
        {product.name}
      </h3>

      {product.shortDescription && (
        <p className="text-sm text-[var(--color-muted)]">{product.shortDescription}</p>
      )}

      <div className="mt-2 flex items-end justify-between border-t border-[var(--color-border)] pt-3">
        <div>
          {product.lowestPrice !== null ? (
            <>
              <span className="text-xs text-[var(--color-muted)]">
                {product.isMsrp ? "MSRP" : "From"}
              </span>
              <p className="text-lg font-medium text-[var(--color-accent)]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.currency,
                }).format(product.lowestPrice)}
              </p>
            </>
          ) : (
            <span className="text-sm text-[var(--color-muted)]">Price varies</span>
          )}
        </div>
        {product.merchantCount > 0 && (
          <span className="text-xs text-[var(--color-muted)]">
            {product.merchantCount} {product.merchantCount === 1 ? "seller" : "sellers"}
          </span>
        )}
      </div>
    </Link>
  );
}
