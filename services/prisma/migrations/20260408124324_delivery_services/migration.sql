-- AlterTable
ALTER TABLE "delivery_profile" ADD COLUMN     "payoutHoldBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "seller_profile" ADD COLUMN     "payoutHoldBalance" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "company_account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'B-Mart Platform',
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "heldBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCommissionEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTaxCollected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeliveryFeesCollected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_ledger_entries" (
    "id" TEXT NOT NULL,
    "companyAccountId" TEXT NOT NULL,
    "paymentId" TEXT,
    "orderId" TEXT,
    "type" "LedgerType" NOT NULL,
    "bucket" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fromEntityType" TEXT,
    "fromEntityId" TEXT,
    "toEntityType" TEXT,
    "toEntityId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_ledger_entries_companyAccountId_createdAt_idx" ON "company_ledger_entries"("companyAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "company_ledger_entries_paymentId_idx" ON "company_ledger_entries"("paymentId");

-- CreateIndex
CREATE INDEX "company_ledger_entries_orderId_idx" ON "company_ledger_entries"("orderId");

-- AddForeignKey
ALTER TABLE "company_ledger_entries" ADD CONSTRAINT "company_ledger_entries_companyAccountId_fkey" FOREIGN KEY ("companyAccountId") REFERENCES "company_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_ledger_entries" ADD CONSTRAINT "company_ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
