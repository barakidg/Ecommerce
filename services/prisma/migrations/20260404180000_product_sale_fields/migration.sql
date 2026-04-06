-- AlterTable
ALTER TABLE "products" ADD COLUMN "salePrice" DECIMAL(10,2),
ADD COLUMN "productDiscountAmount" DECIMAL(10,2),
ADD COLUMN "saleEndsAt" TIMESTAMP(3);
