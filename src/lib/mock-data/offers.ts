/**
 * MOCK DATA — for local development and seeding only. See merchants.ts header note.
 *
 * Prices are illustrative placeholders, not scraped or verified real-time prices.
 * lastChecked is intentionally null — we've never actually checked these.
 */

import type { ProductOffer } from "@prisma/client";

type MockOffer = Omit<
  ProductOffer,
  "createdAt" | "updatedAt" | "affiliateUrl" | "trackingMetadata" | "lastChecked" | "price"
> & { affiliateUrl: null; trackingMetadata: null; lastChecked: null; price: number };

export const MOCK_OFFERS: MockOffer[] = [
  {
    id: "offer_alpha_amazon",
    productId: "product_standing_desk_alpha",
    merchantId: "merchant_amazon",
    url: "https://www.amazon.com/example-alpha-standing-desk",
    price: 399.0,
    currency: "USD",
    availability: "IN_STOCK",
    affiliateUrl: null,
    isMsrp: false,
    trackingMetadata: null,
    lastChecked: null,
  },
  {
    id: "offer_alpha_ebay",
    productId: "product_standing_desk_alpha",
    merchantId: "merchant_ebay",
    url: "https://www.ebay.com/example-alpha-standing-desk",
    price: 379.0,
    currency: "USD",
    availability: "IN_STOCK",
    affiliateUrl: null,
    isMsrp: false,
    trackingMetadata: null,
    lastChecked: null,
  },
  {
    id: "offer_beta_amazon",
    productId: "product_standing_desk_beta",
    merchantId: "merchant_amazon",
    url: "https://www.amazon.com/example-beta-standing-desk",
    price: 349.0,
    currency: "USD",
    availability: "IN_STOCK",
    affiliateUrl: null,
    isMsrp: false,
    trackingMetadata: null,
    lastChecked: null,
  },
  {
    id: "offer_gamma_amazon",
    productId: "product_ergo_chair_gamma",
    merchantId: "merchant_amazon",
    url: "https://www.amazon.com/example-gamma-chair",
    price: 249.0,
    currency: "USD",
    availability: "IN_STOCK",
    affiliateUrl: null,
    isMsrp: false,
    trackingMetadata: null,
    lastChecked: null,
  },
  {
    id: "offer_gamma_ebay",
    productId: "product_ergo_chair_gamma",
    merchantId: "merchant_ebay",
    url: "https://www.ebay.com/example-gamma-chair",
    price: 259.0,
    currency: "USD",
    availability: "UNKNOWN",
    affiliateUrl: null,
    isMsrp: false,
    trackingMetadata: null,
    lastChecked: null,
  },
];
