/**
 * Workers-only raw-SQL path (OPTICSSCOUT_DB_DRIVER = "neon-sql") for the three
 * request-time database routes: /search, GET /api/click/[productId]/[merchantId] and
 * POST /api/click-event. Uses @neondatabase/serverless over HTTPS with parameterized
 * queries only (tagged templates / $n placeholders; user input is never concatenated
 * into SQL). Each function mirrors one Prisma call exactly; see src/lib/db/click-data.ts
 * and searchContent in src/lib/content/repository.ts for the Prisma equivalents.
 *
 * Never used on Vercel/Node or during the build: callers check isWorkerSqlMode() first.
 */

import { neon } from "@neondatabase/serverless";
import type { SeoStatus } from "@prisma/client";
import { cuid } from "./cuid";

export const isWorkerSqlMode = () =>
  process.env.OPTICSSCOUT_RUNTIME === "cloudflare-workers" &&
  process.env.OPTICSSCOUT_DB_DRIVER === "neon-sql";

const sql = () => neon(process.env.DATABASE_URL as string);

// ---- search: mirrors prisma.<model>.findMany({ where: { seoStatus: "INDEXABLE" } }) ------
// No ORDER BY, exactly like the Prisma queries (result order = database order).
export interface SearchRows {
  products: { name: string; brand: string | null; shortDescription: string | null; slug: string; canonicalPath: string | null; seoStatus: SeoStatus }[];
  guides: { title: string; slug: string; canonicalPath: string | null; seoStatus: SeoStatus }[];
  comparisons: { title: string; slug: string; canonicalPath: string | null; seoStatus: SeoStatus }[];
  bestPages: { title: string; slug: string; canonicalPath: string | null; seoStatus: SeoStatus }[];
}

export async function searchRowsSql(): Promise<SearchRows> {
  const db = sql();
  const [products, guides, comparisons, bestPages] = await db.transaction(
    [
      db`SELECT "name", "brand", "shortDescription", "slug", "canonicalPath", "seoStatus"::text AS "seoStatus" FROM "Product" WHERE "seoStatus" = 'INDEXABLE' ORDER BY "createdAt" ASC, "id" ASC`,
      db`SELECT "title", "slug", "canonicalPath", "seoStatus"::text AS "seoStatus" FROM "Guide" WHERE "seoStatus" = 'INDEXABLE' ORDER BY "createdAt" ASC, "id" ASC`,
      db`SELECT "title", "slug", "canonicalPath", "seoStatus"::text AS "seoStatus" FROM "Comparison" WHERE "seoStatus" = 'INDEXABLE' ORDER BY "createdAt" ASC, "id" ASC`,
      db`SELECT "title", "slug", "canonicalPath", "seoStatus"::text AS "seoStatus" FROM "BestPage" WHERE "seoStatus" = 'INDEXABLE' ORDER BY "createdAt" ASC, "id" ASC`,
    ],
    { readOnly: true },
  );
  return { products, guides, comparisons, bestPages } as unknown as SearchRows;
}

// ---- click routes -------------------------------------------------------------------------
export interface OfferRow { url: string; productId: string; active: boolean }
export interface MerchantRow { affiliateNetwork: string; affiliateProgram: string | null; active: boolean }

/** prisma.productOffer.findUnique({ where: { productId_merchantId } }) +
 *  prisma.merchant.findUnique({ where: { id: merchantId } }) — one HTTP round trip. */
export async function offerAndMerchantSql(productId: string, merchantId: string) {
  const db = sql();
  const [offers, merchants] = await db.transaction(
    [
      db`SELECT "url", "productId", "active" FROM "ProductOffer" WHERE "productId" = ${productId} AND "merchantId" = ${merchantId} LIMIT 1`,
      db`SELECT "affiliateNetwork"::text AS "affiliateNetwork", "affiliateProgram", "active" FROM "Merchant" WHERE "id" = ${merchantId} LIMIT 1`,
    ],
    { readOnly: true },
  );
  return {
    offer: (offers[0] as OfferRow | undefined) ?? null,
    merchant: (merchants[0] as MerchantRow | undefined) ?? null,
  };
}

/** prisma.clickEvent.create({ data }) — id generated client-side in cuid format (the
 *  column has no database default, as with Prisma); createdAt uses the column default. */
export async function insertClickEventSql(data: {
  productId: string;
  merchantId: string;
  page: string;
  placement: string;
  sessionId: string;
}): Promise<void> {
  const db = sql();
  await db`INSERT INTO "ClickEvent" ("id", "productId", "merchantId", "page", "placement", "sessionId")
           VALUES (${cuid()}, ${data.productId}, ${data.merchantId}, ${data.page}, ${data.placement}, ${data.sessionId})`;
}
