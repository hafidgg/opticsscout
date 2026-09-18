import type { Merchant, ProductOffer } from "@prisma/client";
import type { MerchantAdapter } from "./adapters/types";
import { AmazonAdapter } from "./adapters/amazon";
import { EbayAdapter } from "./adapters/ebay";
import { EtsyAdapter } from "./adapters/etsy";
import { AwinAdapter } from "./adapters/awin";

/**
 * Central affiliate URL service (Section 17). No component or route should ever
 * construct an affiliate link by hand — always go through this function.
 */

const adapters: Record<string, MerchantAdapter> = {
  AMAZON: new AmazonAdapter(),
  EBAY: new EbayAdapter(),
  ETSY: new EtsyAdapter(),
  AWIN: new AwinAdapter(),
};

export interface AffiliateUrlResult {
  url: string;
  /** False when the relevant adapter had no credentials configured — the url returned
   *  is a plain (non-affiliate-tagged) link in that case. UI can use this to decide
   *  whether to silently render a normal link vs. an affiliate CTA. Never surfaced to
   *  end users as an error — see MONETIZATION.md §3. */
  isAffiliateLink: boolean;
  merchantSlug: string;
}

/**
 * Resolves an offer's outbound URL through the right merchant adapter.
 *
 * @param offer   The ProductOffer being linked to.
 * @param merchant The Merchant the offer belongs to (must match offer.merchantId).
 * @param campaign Optional campaign/placement label for network-level attribution.
 */
export function getAffiliateUrl(
  offer: Pick<ProductOffer, "url" | "productId">,
  merchant: Pick<Merchant, "affiliateNetwork" | "affiliateProgram">,
  campaign?: string
): AffiliateUrlResult {
  const adapter = adapters[merchant.affiliateNetwork];

  if (!adapter) {
    // Network not yet implemented (e.g. IMPACT, CJ, ENVATO, GUMROAD) — fail safe.
    return {
      url: offer.url,
      isAffiliateLink: false,
      merchantSlug: merchant.affiliateNetwork.toLowerCase(),
    };
  }

  const isConfigured = adapter.isConfigured();

  const url = adapter.buildAffiliateUrl({
    destinationUrl: offer.url,
    productId: offer.productId,
    campaign,
    merchantProgramId: merchant.affiliateProgram ?? undefined,
  });

  return {
    url,
    isAffiliateLink: isConfigured,
    merchantSlug: adapter.merchantSlug,
  };
}
