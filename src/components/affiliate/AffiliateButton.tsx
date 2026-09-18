/**
 * CTA button for an affiliate offer. Always routes through the first-party click
 * tracking redirect (/api/click/[productId]/[merchantId]) rather than linking straight
 * to the merchant — this is what makes click tracking and consistent disclosure work
 * everywhere (Section 18, MONETIZATION.md §3/§5).
 *
 * Never renders aggressive copy like "BUY NOW!!!" — see Section 24.
 */

interface AffiliateButtonProps {
  productId: string;
  merchantId: string;
  merchantName: string;
  page: string;
  placement: string;
  price?: number | null;
  currency?: string;
  /** True when price is a manufacturer MSRP, not a live price from this merchant. */
  isMsrp?: boolean;
}

export function AffiliateButton({
  productId,
  merchantId,
  merchantName,
  page,
  placement,
  price,
  currency = "USD",
  isMsrp = false,
}: AffiliateButtonProps) {
  const href = `/api/click/${productId}/${merchantId}?page=${encodeURIComponent(
    page
  )}&placement=${encodeURIComponent(placement)}`;

  return (
    <a
      href={href}
      rel="sponsored noopener noreferrer"
      target="_blank"
      className="inline-flex items-center justify-between gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-400 hover:shadow"
    >
      <span>Check price at {merchantName}</span>
      {typeof price === "number" && (
        <span className="text-neutral-500">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(price)}
          {isMsrp && " MSRP"}
        </span>
      )}
    </a>
  );
}
