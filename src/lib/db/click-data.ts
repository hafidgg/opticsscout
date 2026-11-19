/**
 * Data access for the two click-tracking routes. Default (Vercel/Node, and the Worker with
 * the "pg" / "neon-http" drivers): the exact Prisma calls the routes always made. Worker
 * with OPTICSSCOUT_DB_DRIVER = "neon-sql": the equivalent parameterized SQL in
 * src/lib/db/neon-sql.ts (no Prisma at request time).
 */

import type { AffiliateNetwork } from "@prisma/client";
import { prisma } from "./client";
import { insertClickEventSql, offerAndMerchantSql, isWorkerSqlMode } from "./neon-sql";

export interface ClickOffer {
  url: string;
  productId: string;
  active: boolean;
}
export interface ClickMerchant {
  affiliateNetwork: AffiliateNetwork;
  affiliateProgram: string | null;
  active: boolean;
}

/** GET /api/click: the offer by (productId, merchantId) and the merchant by id. */
export async function getOfferAndMerchant(
  productId: string,
  merchantId: string,
): Promise<{ offer: ClickOffer | null; merchant: ClickMerchant | null }> {
  if (isWorkerSqlMode()) {
    const { offer, merchant } = await offerAndMerchantSql(productId, merchantId);
    return {
      offer,
      merchant: merchant && { ...merchant, affiliateNetwork: merchant.affiliateNetwork as AffiliateNetwork },
    };
  }
  const [offer, merchant] = await Promise.all([
    prisma.productOffer.findUnique({ where: { productId_merchantId: { productId, merchantId } } }),
    prisma.merchant.findUnique({ where: { id: merchantId } }),
  ]);
  return { offer, merchant };
}

/** POST /api/click-event: the offer by (productId, merchantId) with its merchant
 *  (ProductOffer.merchantId references Merchant.id, so this is the same merchant row). */
export async function getOfferWithMerchant(
  productId: string,
  merchantId: string,
): Promise<{ active: boolean; merchant: { active: boolean } } | null> {
  if (isWorkerSqlMode()) {
    const { offer, merchant } = await offerAndMerchantSql(productId, merchantId);
    return offer && merchant ? { active: offer.active, merchant: { active: merchant.active } } : null;
  }
  return prisma.productOffer.findUnique({
    where: { productId_merchantId: { productId, merchantId } },
    include: { merchant: true },
  });
}

export async function recordClickEvent(data: {
  productId: string;
  merchantId: string;
  page: string;
  placement: string;
  sessionId: string;
}): Promise<void> {
  if (isWorkerSqlMode()) {
    await insertClickEventSql(data);
    return;
  }
  await prisma.clickEvent.create({ data });
}
