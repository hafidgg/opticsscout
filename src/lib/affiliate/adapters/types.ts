/**
 * Shared contract every merchant/network adapter implements.
 *
 * The rest of the application never branches on "if merchant is Amazon" — it calls
 * getAffiliateUrl(offer), which looks up the right adapter by merchant.affiliateNetwork
 * and delegates. See ARCHITECTURE.md §3.
 */

export interface BuildAffiliateUrlInput {
  /** The clean, canonical destination URL (no tracking params — see Section 32). */
  destinationUrl: string;
  /** Our internal product id, useful for adapters that support sub-tracking/campaigns. */
  productId: string;
  /** Optional campaign/placement label for attribution within the network's own system. */
  campaign?: string;
  /**
   * Optional network-specific program/advertiser id (e.g. Awin's per-merchant
   * awinmid). Expected to be sourced from Merchant.affiliateProgram in the DB.
   * Most adapters ignore this field.
   */
  merchantProgramId?: string;
}

export interface MerchantAdapter {
  /** Must match a Merchant.slug value in the DB, e.g. "amazon", "ebay". */
  readonly merchantSlug: string;

  /**
   * True only when this adapter has the credentials it needs (env vars set).
   * Callers MUST check this before trusting buildAffiliateUrl to produce a real
   * affiliate-tagged link — see MONETIZATION.md §3 for the "app works with zero
   * credentials" requirement.
   */
  isConfigured(): boolean;

  /**
   * Builds the outbound URL. When isConfigured() is false, implementations must
   * return the plain destinationUrl unchanged rather than emitting a broken or
   * partially-tagged affiliate link.
   */
  buildAffiliateUrl(input: BuildAffiliateUrlInput): string;
}
