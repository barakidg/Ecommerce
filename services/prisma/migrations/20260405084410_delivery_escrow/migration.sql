-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "adminResolutionNote" TEXT,
ADD COLUMN     "orderItemId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "deliveryProfileId" TEXT,
ADD COLUMN     "escrowReleasedAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryConfirmationCode" TEXT,
ADD COLUMN     "deliveryFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryProfileId" TEXT,
ADD COLUMN     "disputeWindowEndsAt" TIMESTAMP(3),
ADD COLUMN     "fundsReleasedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "delivery_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "vehicleLabel" TEXT,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "heldBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_payouts" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'CHAPA',
    "providerRef" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_profile_userId_key" ON "delivery_profile"("userId");

-- CreateIndex
CREATE INDEX "delivery_profile_userId_idx" ON "delivery_profile"("userId");

-- CreateIndex
CREATE INDEX "delivery_payouts_deliveryProfileId_idx" ON "delivery_payouts"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "disputes_orderItemId_idx" ON "disputes"("orderItemId");

-- CreateIndex
CREATE INDEX "order_items_deliveryProfileId_idx" ON "order_items"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "orders_deliveryProfileId_idx" ON "orders"("deliveryProfileId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "delivery_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "delivery_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_profile" ADD CONSTRAINT "delivery_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_payouts" ADD CONSTRAINT "delivery_payouts_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "delivery_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
