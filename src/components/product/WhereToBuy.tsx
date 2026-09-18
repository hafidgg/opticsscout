import { AffiliateButton } from "@/components/affiliate/AffiliateButton";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

export interface OfferForDisplay {
  id: string;
  merchantId: string;
  merchantName: string;
  price: number | null;
  currency: string;
  /** True when price is a manufacturer MSRP, not a live price from this merchant. */
  isMsrp: boolean;
  availability: string;
}

/**
 * "Where to buy" section (master brief §24) — lists merchant offers for a product,
 * each routed through the first-party affiliate click tracking (Section 18,
 * MONETIZATION.md §5). Sorted lowest price first so the comparison is honest and
 * useful, not just a list in DB insertion order.
 */
export function WhereToBuy({
  productId,
  offers,
  page,
}: {
  productId: string;
  offers: OfferForDisplay[];
  page: string;
}) {
  if (offers.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No merchant offers available yet for this product.
      </p>
    );
  }

  const sorted = [...offers].sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">Where to buy</h2>
      <ul className="flex flex-col gap-2">
        {sorted.map((offer, index) => (
          <li
            key={offer.id}
            className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-paper-raised)] p-3"
          >
            <div className="flex items-center gap-2">
              {index === 0 && offer.price !== null && !offer.isMsrp && (
                <span className="rounded-full bg-[var(--color-good)] px-2 py-0.5 text-xs font-medium text-white">
                  Best price
                </span>
              )}
              <span className="text-sm text-[var(--color-ink)]">{offer.merchantName}</span>
              {offer.availability === "OUT_OF_STOCK" && (
                <span className="text-xs text-[var(--color-muted)]">Out of stock</span>
              )}
            </div>
            <AffiliateButton
              productId={productId}
              merchantId={offer.merchantId}
              merchantName={offer.merchantName}
              page={page}
              placement="where-to-buy"
              price={offer.price}
              currency={offer.currency}
              isMsrp={offer.isMsrp}
            />
          </li>
        ))}
      </ul>
      {offers.some((o) => o.isMsrp) && (
        <p className="text-xs text-[var(--color-muted)]">
          Price shown is manufacturer&rsquo;s suggested retail price — check the
          retailer link for current pricing.
        </p>
      )}
      <AffiliateDisclosure />
    </div>
  );
}
