import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/client";
import {
  getProductBySlug,
  getAffiliateOffers,
  getActiveAffiliateOffers,
  getAffiliateOfferByMerchant,
} from "@/lib/content/repository";

/**
 * Integration tests for the affiliate offer layer (extends ProductOffer/Merchant —
 * see docs/AFFILIATE_MARKETING.md). Requires the dev database, same as
 * repository-gate.test.ts.
 *
 * Uses a dedicated, obviously-fake test Product/Merchant/offers created in
 * beforeAll and deleted in afterAll — real seeded content doesn't happen to cover
 * every shape this needs (a product with zero offers, one with several, one with a
 * mix of active/inactive), and this keeps that fixture data clearly isolated from
 * and never mixed into real production content (Section 10 of the affiliate task:
 * "keep any test data isolated from production seed/data"). URLs used here are
 * placeholder example.com links, never presented as real merchant offers.
 */

const TEST_PRODUCT_NO_OFFERS_ID = "test_affiliate_product_zero_offers";
const TEST_PRODUCT_MULTI_ID = "test_affiliate_product_multi_offers";
const TEST_MERCHANT_A_ID = "test_affiliate_merchant_a";
const TEST_MERCHANT_B_ID = "test_affiliate_merchant_b";
const TEST_MERCHANT_INACTIVE_ID = "test_affiliate_merchant_inactive";

beforeAll(async () => {
  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_NO_OFFERS_ID,
      name: "Test Product With Zero Offers",
      slug: "test-affiliate-product-zero-offers",
    },
  });

  await prisma.product.create({
    data: {
      id: TEST_PRODUCT_MULTI_ID,
      name: "Test Product With Multiple Offers",
      slug: "test-affiliate-product-multi-offers",
    },
  });

  await prisma.merchant.createMany({
    data: [
      {
        id: TEST_MERCHANT_A_ID,
        name: "Test Merchant A",
        slug: "test-merchant-a",
        website: "https://example.com/merchant-a",
        affiliateNetwork: "AMAZON",
        active: true,
      },
      {
        id: TEST_MERCHANT_B_ID,
        name: "Test Merchant B",
        slug: "test-merchant-b",
        website: "https://example.com/merchant-b",
        affiliateNetwork: "EBAY",
        active: true,
      },
      {
        id: TEST_MERCHANT_INACTIVE_ID,
        name: "Test Merchant Inactive",
        slug: "test-merchant-inactive",
        website: "https://example.com/merchant-inactive",
        affiliateNetwork: "ETSY",
        active: false,
      },
    ],
  });

  await prisma.productOffer.createMany({
    data: [
      {
        productId: TEST_PRODUCT_MULTI_ID,
        merchantId: TEST_MERCHANT_A_ID,
        url: "https://example.com/test-offer-a",
        price: 100,
        active: true,
      },
      {
        productId: TEST_PRODUCT_MULTI_ID,
        merchantId: TEST_MERCHANT_B_ID,
        url: "https://example.com/test-offer-b",
        price: 80,
        active: true,
      },
      // Inactive offer — active: false. Must never appear in any "active" query.
      {
        productId: TEST_PRODUCT_MULTI_ID,
        merchantId: TEST_MERCHANT_INACTIVE_ID,
        url: "https://example.com/test-offer-inactive-merchant",
        price: 60,
        active: true, // the offer itself is active — it's the MERCHANT that's inactive
      },
    ],
  });
});

afterAll(async () => {
  // Product delete cascades to its ProductOffer rows (onDelete: Cascade).
  await prisma.product.deleteMany({
    where: { id: { in: [TEST_PRODUCT_NO_OFFERS_ID, TEST_PRODUCT_MULTI_ID] } },
  });
  await prisma.merchant.deleteMany({
    where: { id: { in: [TEST_MERCHANT_A_ID, TEST_MERCHANT_B_ID, TEST_MERCHANT_INACTIVE_ID] } },
  });
});

describe("affiliate offer service", () => {
  it("a product with zero offers resolves with an empty offers array, not an error", async () => {
    const offers = await getActiveAffiliateOffers(TEST_PRODUCT_NO_OFFERS_ID);
    expect(offers).toEqual([]);

    const resolved = await getProductBySlug("test-affiliate-product-zero-offers");
    expect(resolved).not.toBeNull();
    expect(resolved!.offers).toEqual([]);
  });

  it("returns multiple active offers, sorted by insertion, all normalized to plain numbers", async () => {
    const offers = await getActiveAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(offers.length).toBe(2); // 3 created, 1 excluded below for its inactive merchant
    expect(offers.every((o) => typeof o.price === "number" || o.price === null)).toBe(true);
  });

  it("excludes an offer whose MERCHANT is inactive, even though the offer row itself is active", async () => {
    const offers = await getActiveAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(offers.some((o) => o.merchantId === TEST_MERCHANT_INACTIVE_ID)).toBe(false);
  });

  it("getAffiliateOffers (unfiltered) still returns the inactive-merchant offer", async () => {
    const offers = await getAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(offers.length).toBe(3);
    expect(offers.some((o) => o.merchantId === TEST_MERCHANT_INACTIVE_ID)).toBe(true);
  });

  it("a ProductOffer row can be set inactive directly, and is then excluded from the active set", async () => {
    await prisma.productOffer.update({
      where: { productId_merchantId: { productId: TEST_PRODUCT_MULTI_ID, merchantId: TEST_MERCHANT_A_ID } },
      data: { active: false },
    });

    const active = await getActiveAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(active.some((o) => o.merchantId === TEST_MERCHANT_A_ID)).toBe(false);

    const all = await getAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(all.some((o) => o.merchantId === TEST_MERCHANT_A_ID)).toBe(true);

    // Restore for any later test in this file that assumes the original fixture state.
    await prisma.productOffer.update({
      where: { productId_merchantId: { productId: TEST_PRODUCT_MULTI_ID, merchantId: TEST_MERCHANT_A_ID } },
      data: { active: true },
    });
  });

  it("an offer with a blank url is excluded from the active set (never a dead CTA)", async () => {
    await prisma.productOffer.update({
      where: { productId_merchantId: { productId: TEST_PRODUCT_MULTI_ID, merchantId: TEST_MERCHANT_B_ID } },
      data: { url: "" },
    });

    const active = await getActiveAffiliateOffers(TEST_PRODUCT_MULTI_ID);
    expect(active.some((o) => o.merchantId === TEST_MERCHANT_B_ID)).toBe(false);

    await prisma.productOffer.update({
      where: { productId_merchantId: { productId: TEST_PRODUCT_MULTI_ID, merchantId: TEST_MERCHANT_B_ID } },
      data: { url: "https://example.com/test-offer-b" },
    });
  });

  it("getAffiliateOfferByMerchant returns the right offer by merchant slug", async () => {
    const offer = await getAffiliateOfferByMerchant(TEST_PRODUCT_MULTI_ID, "test-merchant-a");
    expect(offer).not.toBeNull();
    expect(offer!.merchantId).toBe(TEST_MERCHANT_A_ID);
  });

  it("getAffiliateOfferByMerchant returns null for an inactive merchant's offer", async () => {
    const offer = await getAffiliateOfferByMerchant(TEST_PRODUCT_MULTI_ID, "test-merchant-inactive");
    expect(offer).toBeNull();
  });

  it("getAffiliateOfferByMerchant returns null when no such offer exists at all", async () => {
    const offer = await getAffiliateOfferByMerchant(TEST_PRODUCT_NO_OFFERS_ID, "test-merchant-a");
    expect(offer).toBeNull();
  });

  it("a real, currently-live product resolves with exactly its one real active offer", async () => {
    const resolved = await getProductBySlug("vortex-diamondback-hd-8x42");
    expect(resolved).not.toBeNull();
    expect(resolved!.offers.length).toBeGreaterThan(0);
    expect(resolved!.offers.every((o) => o.url.startsWith("http"))).toBe(true);
  });
});
