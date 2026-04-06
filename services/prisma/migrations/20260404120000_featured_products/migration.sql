-- CreateEnum
CREATE TYPE "FeaturedRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "featuredUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "featured_product_requests" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" "FeaturedRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionNote" TEXT,

    CONSTRAINT "featured_product_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

CREATE INDEX "featured_product_requests_status_idx" ON "featured_product_requests"("status");

CREATE INDEX "featured_product_requests_productId_idx" ON "featured_product_requests"("productId");

-- AddForeignKey
ALTER TABLE "featured_product_requests" ADD CONSTRAINT "featured_product_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "featured_product_requests" ADD CONSTRAINT "featured_product_requests_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
