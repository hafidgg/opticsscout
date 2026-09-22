-- AlterEnum
ALTER TYPE "AffiliateNetwork" ADD VALUE 'AVANTLINK';

-- AlterTable
ALTER TABLE "ProductOffer" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ProductOffer_productId_active_idx" ON "ProductOffer"("productId", "active");
