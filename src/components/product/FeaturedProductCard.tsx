import Link from "next/link";
import { AffiliateButton } from "@/components/affiliate/AffiliateButton";

export interface FeaturedProductCardData {
  productId: string;
  slug: string;
  name: string;
  categoryLabel: string;
  price: number | null;
  currency: string;
  isMsrp: boolean;
  merchantId: string;
  merchantName: string;
}

/**
 * Carousel card for the homepage's "Featured Comparisons" section. Deliberately
 * has no star rating and no wishlist/heart icon — this site has neither real
 * ratings nor user accounts, and a fake one of either would violate the
 * no-fabrication rule that governs every other price/rating field on this site
 * (see DATA_MODEL.md §1, docs on never-fabricate). Unlike ProductCard (which
 * links the whole card to the product detail page), this card exposes a direct
 * "Check price at [Merchant]" affiliate CTA — the point of a featured carousel is
 * one-click intent, not a detour through the detail page first.
 */
export function FeaturedProductCard({ product }: { product: FeaturedProductCardData }) {
  return (
    <div className="flex w-64 shrink-0 snap-start flex-col gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {product.categoryLabel}
      </span>

      <Link
        href={`/products/${product.slug}`}
        className="font-serif text-lg leading-snug text-[var(--color-ink)] hover:underline"
      >
        {product.name}
      </Link>

      <div className="mt-1 flex items-baseline gap-1">
        {product.price !== null ? (
          <>
            <span className="text-lg font-medium text-[var(--color-accent)]">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: product.currency,
              }).format(product.price)}
            </span>
            {product.isMsrp && (
              <span className="text-xs text-[var(--color-muted)]">MSRP</span>
            )}
          </>
        ) : (
          <span className="text-sm text-[var(--color-muted)]">Price varies</span>
        )}
      </div>

      {/* Price already shown above — the button itself just says "Check price at
          X" rather than repeating the number a second time. */}
      <div className="mt-2">
        <AffiliateButton
          productId={product.productId}
          merchantId={product.merchantId}
          merchantName={product.merchantName}
          page="/"
          placement="featured-comparisons"
        />
      </div>
    </div>
  );
}
