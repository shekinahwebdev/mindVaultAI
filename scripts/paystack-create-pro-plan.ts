/**
 * One-time helper: create MindVault Pro plan in Paystack TEST dashboard via API.
 *
 * Usage (TEST keys only):
 *   PAYSTACK_SECRET_KEY=sk_test_... \
 *   PAYSTACK_PRO_AMOUNT_SUBUNITS=99900 \
 *   PAYSTACK_PRO_CURRENCY=NGN \
 *   npx tsx scripts/paystack-create-pro-plan.ts
 *
 * Then set PAYSTACK_PRO_PLAN_CODE to the printed plan_code.
 *
 * Amount is in currency subunits (kobo for NGN, cents for USD/GHS per Paystack rules).
 * Match your test plan to product intent — marketing Pro is $9.99 USD; use a TEST amount
 * appropriate for your Paystack integration currency.
 */
import "dotenv/config";

import { paystackRequest } from "../src/lib/billing/paystack/client";

const amount = process.env.PAYSTACK_PRO_AMOUNT_SUBUNITS;
const currency = process.env.PAYSTACK_PRO_CURRENCY ?? "NGN";

async function main() {
  if (!amount) {
    console.error("Set PAYSTACK_PRO_AMOUNT_SUBUNITS (e.g. 99900 for 999.00 NGN).");
    process.exit(1);
  }

  const response = await paystackRequest<{ plan_code: string; name: string }>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: "MindVault Pro (TEST)",
      interval: "monthly",
      amount: Number(amount),
      currency,
    }),
  });

  if (!response.status) {
    console.error(response.message);
    process.exit(1);
  }

  console.log("Created Paystack plan (TEST):");
  console.log(`  plan_code: ${response.data.plan_code}`);
  console.log(`  name: ${response.data.name}`);
  console.log("Add to .env:");
  console.log(`  PAYSTACK_PRO_PLAN_CODE=${response.data.plan_code}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
