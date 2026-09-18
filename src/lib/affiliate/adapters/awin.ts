import type { BuildAffiliateUrlInput, MerchantAdapter } from "./types";

/**
 * Awin adapter.
 *
 * Awin's standard tracking link format wraps the destination URL rather than appending
 * a simple query param:
 * https://www.awin1.com/cread.php?awinmid=<MERCHANT_ID>&awinaffid=<PUBLISHER_ID>&ued=<encoded destination>
 *
 * MERCHANT_ID varies per advertiser/program within Awin and would need to live on the
 * Merchant record (e.g. Merchant.affiliateProgram) rather than as a single global env
 * var, since one Awin publisher account can have many advertiser relationships. This
 * adapter reads AWIN_PUBLISHER_ID as the publisher-level credential; a merchant-specific
 * program ID is expected to be passed in when the calling code has it (falls back to a
 * plain link if it's ever missing).
 *
 * Requires AWIN_PUBLISHER_ID. When unset, falls back to the plain destination URL.
 */
export class AwinAdapter implements MerchantAdapter {
  readonly merchantSlug = "awin";

  isConfigured(): boolean {
    return Boolean(process.env.AWIN_PUBLISHER_ID);
  }

  buildAffiliateUrl({ destinationUrl, merchantProgramId }: BuildAffiliateUrlInput): string {
    const publisherId = process.env.AWIN_PUBLISHER_ID;
    if (!publisherId || !merchantProgramId) return destinationUrl;

    const encodedDestination = encodeURIComponent(destinationUrl);
    return `https://www.awin1.com/cread.php?awinmid=${merchantProgramId}&awinaffid=${publisherId}&ued=${encodedDestination}`;
  }
}
