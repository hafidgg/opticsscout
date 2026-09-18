import type { BuildAffiliateUrlInput, MerchantAdapter } from "./types";

/**
 * eBay Partner Network adapter.
 *
 * Real EPN links are typically generated via the EPN "campaign ID" (campid) appended
 * to a tracked redirect, e.g.
 * https://www.ebay.com/itm/XXXX?campid=YOUR_CAMPAIGN_ID&customid=<optional>
 *
 * Requires EBAY_CAMPAIGN_ID. When unset, falls back to the plain destination URL.
 */
export class EbayAdapter implements MerchantAdapter {
  readonly merchantSlug = "ebay";

  isConfigured(): boolean {
    return Boolean(process.env.EBAY_CAMPAIGN_ID);
  }

  buildAffiliateUrl({ destinationUrl, productId, campaign }: BuildAffiliateUrlInput): string {
    const campid = process.env.EBAY_CAMPAIGN_ID;
    if (!campid) return destinationUrl;

    try {
      const url = new URL(destinationUrl);
      url.searchParams.set("campid", campid);
      // customid lets us correlate EPN reporting back to our own productId/campaign
      // without needing EPN's own API — useful for reconciling click data.
      url.searchParams.set("customid", campaign ?? productId);
      return url.toString();
    } catch {
      return destinationUrl;
    }
  }
}
