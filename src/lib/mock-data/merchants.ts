/**
 * MOCK DATA — for local development and seeding only. Not real merchant/product data.
 *
 * These records are clearly labeled as mock throughout so they're never mistaken for
 * verified product facts (Section 37: no fake data presented as real). Specifications
 * given here are illustrative/plausible for the home-office niche, not sourced from any
 * real product listing — real data must come with a SourceRecord (see DATA_MODEL.md).
 */

import type { Merchant } from "@prisma/client";

export const MOCK_MERCHANTS: Omit<Merchant, "createdAt" | "updatedAt">[] = [
  {
    id: "merchant_amazon",
    name: "Amazon",
    slug: "amazon",
    website: "https://www.amazon.com",
    affiliateNetwork: "AMAZON",
    affiliateProgram: null,
    active: true,
  },
  {
    id: "merchant_ebay",
    name: "eBay",
    slug: "ebay",
    website: "https://www.ebay.com",
    affiliateNetwork: "EBAY",
    affiliateProgram: null,
    active: true,
  },
  {
    id: "merchant_etsy",
    name: "Etsy",
    slug: "etsy",
    website: "https://www.etsy.com",
    affiliateNetwork: "ETSY",
    affiliateProgram: null,
    active: true,
  },
];
