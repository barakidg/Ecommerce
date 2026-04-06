-- AlterTable
ALTER TABLE "products" ADD COLUMN     "attributes" JSONB;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");
