import type { BuildAffiliateUrlInput, MerchantAdapter } from "./types";

/**
 * Etsy Affiliates adapter (Etsy runs its affiliate program through Awin/CJ-style
 * networks depending on region/era — this adapter assumes a direct affiliate ID param
 * as a simplification; if Etsy's program routes through Awin for your account, use the
 * AwinAdapter instead and register Etsy as an Awin-network merchant in the DB).
 *
 * Requires ETSY_AFFILIATE_ID. When unset, falls back to the plain destination URL.
 */
export class EtsyAdapter implements MerchantAdapter {
  readonly merchantSlug = "etsy";

  isConfigured(): boolean {
    return Boolean(process.env.ETSY_AFFILIATE_ID);
  }

  buildAffiliateUrl({ destinationUrl }: BuildAffiliateUrlInput): string {
    const affiliateId = process.env.ETSY_AFFILIATE_ID;
    if (!affiliateId) return destinationUrl;

    try {
      const url = new URL(destinationUrl);
      url.searchParams.set("utm_source", "affiliate");
      url.searchParams.set("affiliate_id", affiliateId);
      return url.toString();
    } catch {
      return destinationUrl;
    }
  }
}
