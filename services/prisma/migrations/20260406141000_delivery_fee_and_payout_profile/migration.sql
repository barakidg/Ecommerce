ALTER TABLE "delivery_profile"
ADD COLUMN "baseDeliveryFeeAmount" DECIMAL(10, 2) NOT NULL DEFAULT 50,
ADD COLUMN "payoutMethod" TEXT,
ADD COLUMN "payoutAccountNumber" TEXT,
ADD COLUMN "payoutAccountHolder" TEXT,
ADD COLUMN "payoutBankName" TEXT;
