/**
 * Reusable affiliate disclosure snippet (Section 3/17, MONETIZATION.md §4).
 * Rendered near affiliate CTAs on product/comparison/best pages — never hidden
 * behind a click, never placed only below the fold when affiliate CTAs are above it.
 */
export function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-neutral-500 ${className}`}>
      This page may contain affiliate links. If you purchase through one, we may earn a
      commission at no extra cost to you.{" "}
      <a href="/affiliate-disclosure" className="underline hover:text-neutral-700">
        Learn more
      </a>
      .
    </p>
  );
}
