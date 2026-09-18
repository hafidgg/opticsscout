import type { BuildAffiliateUrlInput, MerchantAdapter } from "./types";

/**
 * Amazon Associates adapter.
 *
 * Real Amazon Associates links use the `tag` query parameter with your associate tag,
 * e.g. https://www.amazon.com/dp/B0XXXXX?tag=yourtag-20
 *
 * Requires AMAZON_ASSOCIATE_TAG. When unset, isConfigured() is false and the plain
 * destination URL is returned unchanged (see MerchantAdapter contract).
 */
export class AmazonAdapter implements MerchantAdapter {
  readonly merchantSlug = "amazon";

  isConfigured(): boolean {
    return Boolean(process.env.AMAZON_ASSOCIATE_TAG);
  }

  buildAffiliateUrl({ destinationUrl }: BuildAffiliateUrlInput): string {
    const tag = process.env.AMAZON_ASSOCIATE_TAG;
    if (!tag) return destinationUrl;

    try {
      const url = new URL(destinationUrl);
      url.searchParams.set("tag", tag);
      return url.toString();
    } catch {
      // Malformed destinationUrl — fail safe rather than throw during a page render.
      return destinationUrl;
    }
  }
}
