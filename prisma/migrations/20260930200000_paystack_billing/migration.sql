-- AlterEnum
ALTER TYPE "BillingProvider" ADD VALUE 'PAYSTACK';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "provider_plan_code" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "provider_email_token" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "pending_checkout_reference" TEXT;

-- CreateTable
CREATE TABLE "billing_provider_events" (
    "id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_provider_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "provider" "BillingProvider" NOT NULL,
    "provider_reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_provider_events_event_key_key" ON "billing_provider_events"("event_key");

-- CreateIndex
CREATE UNIQUE INDEX "billing_transactions_provider_reference_key" ON "billing_transactions"("provider_reference");

-- CreateIndex
CREATE INDEX "billing_transactions_user_id_created_at_idx" ON "billing_transactions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
