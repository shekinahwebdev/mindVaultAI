-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
CREATE TYPE "BillingProvider" AS ENUM ('NONE', 'STRIPE');
CREATE TYPE "UsageEventType" AS ENUM ('AI_ANALYZE', 'AI_CHAT');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "BillingProvider" NOT NULL DEFAULT 'NONE',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "UsageEventType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "usage_events_user_id_created_at_idx" ON "usage_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "usage_events_user_id_type_created_at_idx" ON "usage_events"("user_id", "type", "created_at");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill Free subscriptions for existing users
INSERT INTO "subscriptions" ("id", "user_id", "plan", "status", "provider", "cancel_at_period_end", "created_at", "updated_at")
SELECT
    'sub_backfill_' || u.id,
    u.id,
    'FREE',
    'ACTIVE',
    'NONE',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "subscriptions" s WHERE s.user_id = u.id
);
