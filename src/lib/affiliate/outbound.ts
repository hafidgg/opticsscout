/**
 * Resolves the outbound link for a buy button. Server-side only: reads
 * AMAZON_ASSOCIATE_TAG at render time (pages are static, so the value is baked in
 * at build time).
 *
 * Amazon: direct product link https://www.amazon.com/dp/<ASIN>[?tag=...], per Amazon
 * Associates Support's recommendation to use direct links instead of our redirect.
 * The ASIN is read from the stored offer URL only; if it can't be parsed, no Amazon
 * link is produced (never guessed, never routed through /api/click).
 * Other merchants: unchanged first-party /api/click redirect.
 */
export const AMAZON_MERCHANT_ID = "merchant_amazon";
const AMAZON_ASIN_PATTERN =
  /^https:\/\/(?:www\.)?amazon\.com\/(?:[^/?#]+\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?#]|$)/;

export interface ClickBeacon {
  productId: string;
  merchantId: string;
  page: string;
  placement: string;
}

export interface OutboundLink {
  href: string;
  rel: string;
  beacon: ClickBeacon | null;
}

export function resolveOutboundLink(input: {
  productId: string;
  merchantId: string;
  offerUrl: string;
  page: string;
  placement: string;
}): OutboundLink | null {
  const { productId, merchantId, offerUrl, page, placement } = input;

  if (merchantId === AMAZON_MERCHANT_ID) {
    const asin = offerUrl.match(AMAZON_ASIN_PATTERN)?.[1];
    if (!asin) return null;
    const url = new URL(`https://www.amazon.com/dp/${asin}`);
    const tag = process.env.AMAZON_ASSOCIATE_TAG;
    if (tag) url.searchParams.set("tag", tag);
    return {
      href: url.toString(),
      rel: "sponsored nofollow noopener",
      beacon: { productId, merchantId, page, placement },
    };
  }

  return {
    href: `/api/click/${productId}/${merchantId}?page=${encodeURIComponent(
      page
    )}&placement=${encodeURIComponent(placement)}`,
    rel: "sponsored nofollow noopener noreferrer",
    beacon: null,
  };
}
