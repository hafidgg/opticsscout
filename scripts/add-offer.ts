/**
 * Utility: add (or update) a real ProductOffer via Prisma — the safe, documented way
 * to add an affiliate offer once a merchant/network relationship is real (see
 * docs/AFFILIATE_MARKETING.md). Upserts on the existing (productId, merchantId)
 * unique constraint, so re-running with the same product/merchant just updates that
 * one row rather than creating a duplicate.
 *
 * This script inserts NOTHING by itself — every value comes from the operator's own
 * CLI arguments. It is never run with fake/placeholder data against production; see
 * docs/AFFILIATE_MARKETING.md's explicit "never invent affiliate URLs" rule.
 *
 * Run: npx tsx scripts/add-offer.ts <productId> <merchantId> <url> <price|none> [--msrp] [--inactive]
 *
 *   productId   Product.id (see `npx tsx scripts/set-seo-status.ts` usage, or query the DB)
 *   merchantId  Merchant.id — must already exist (see "How to add a merchant" in the docs)
 *   url         The real destination URL from the merchant/network, exactly as given —
 *               never a guessed or constructed one
 *   price       A number (e.g. 349.99), or the literal string "none" if no verified
 *               current price exists yet
 *   --msrp      Mark this price as a manufacturer MSRP, not a live merchant price
 *   --inactive  Insert the row but keep it hidden from every public page and the
 *               click-redirect route (active: false) — for staging a real offer ahead
 *               of approval. Omit this flag once approved to go live immediately.
 *
 * Example (illustrative only — replace every value with the real one):
 *   npx tsx scripts/add-offer.ts product_vortex_ranger_1300 merchant_opticsplanet \
 *     "https://www.opticsplanet.com/real-product-page" 449.99 --msrp --inactive
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const [productId, merchantId, url, priceArg] = args.filter((a) => !a.startsWith("--"));

  if (!productId || !merchantId || !url || !priceArg) {
    console.error(
      'Usage: tsx scripts/add-offer.ts <productId> <merchantId> <url> <price|none> [--msrp] [--inactive]'
    );
    process.exitCode = 1;
    return;
  }

  const [product, merchant] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.merchant.findUnique({ where: { id: merchantId } }),
  ]);
  if (!product) {
    console.error(`No Product with id "${productId}". Nothing written.`);
    process.exitCode = 1;
    return;
  }
  if (!merchant) {
    console.error(
      `No Merchant with id "${merchantId}". Add the merchant first — see "How to add a merchant" in docs/AFFILIATE_MARKETING.md.`
    );
    process.exitCode = 1;
    return;
  }

  const price = priceArg === "none" ? null : Number(priceArg);
  if (priceArg !== "none" && Number.isNaN(price)) {
    console.error(`"${priceArg}" is not a valid number (or the literal "none").`);
    process.exitCode = 1;
    return;
  }

  const data = {
    url,
    price,
    isMsrp: flags.has("--msrp"),
    active: !flags.has("--inactive"),
  };

  const offer = await prisma.productOffer.upsert({
    where: { productId_merchantId: { productId, merchantId } },
    create: { productId, merchantId, ...data },
    update: data,
  });

  console.log(
    `Offer ${offer.id}: ${product.name} <-> ${merchant.name} — active: ${offer.active}, price: ${offer.price ?? "none"}${offer.isMsrp ? " (MSRP)" : ""}`
  );
  if (!offer.active) {
    console.log(
      "This offer is INACTIVE — it will not render on any public page or work via /api/click until flipped active."
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
