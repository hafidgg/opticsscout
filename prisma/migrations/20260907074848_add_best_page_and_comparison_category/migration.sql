-- AlterTable
ALTER TABLE "Comparison" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "BestPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT,
    "verdict" TEXT,
    "categoryId" TEXT,
    "seoStatus" "SeoStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BestPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BestPageProduct" (
    "bestPageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "BestPageProduct_pkey" PRIMARY KEY ("bestPageId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "BestPage_slug_key" ON "BestPage"("slug");

-- CreateIndex
CREATE INDEX "BestPage_categoryId_idx" ON "BestPage"("categoryId");

-- CreateIndex
CREATE INDEX "BestPage_seoStatus_idx" ON "BestPage"("seoStatus");

-- CreateIndex
CREATE INDEX "BestPageProduct_productId_idx" ON "BestPageProduct"("productId");

-- CreateIndex
CREATE INDEX "Comparison_categoryId_idx" ON "Comparison"("categoryId");

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BestPage" ADD CONSTRAINT "BestPage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BestPageProduct" ADD CONSTRAINT "BestPageProduct_bestPageId_fkey" FOREIGN KEY ("bestPageId") REFERENCES "BestPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BestPageProduct" ADD CONSTRAINT "BestPageProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
