import { NextResponse } from "next/server";

import { applyVerifiedTransactionToSubscription } from "@/lib/billing/paystack/sync-subscription";
import { verifyPaystackTransaction } from "@/lib/billing/paystack/verify-transaction";
import { getSubscriptionBillingMeta } from "@/lib/billing/billing-meta";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { serializeSubscriptionPayload } from "@/lib/billing/serialize-subscription";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const reference =
    typeof body === "object" &&
    body !== null &&
    "reference" in body &&
    typeof (body as { reference: unknown }).reference === "string"
      ? (body as { reference: string }).reference.trim()
      : "";

  if (!reference) {
    return NextResponse.json({ ok: false, message: "Missing reference." }, { status: 400 });
  }

  const userId = auth.session.userId;
  const [pendingMatch, existingTx] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, pendingCheckoutReference: reference },
      select: { userId: true },
    }),
    prisma.billingTransaction.findUnique({
      where: { providerReference: reference },
      select: { userId: true },
    }),
  ]);

  if (!pendingMatch && (!existingTx || existingTx.userId !== userId)) {
    return NextResponse.json(
      { ok: false, message: "Unknown or expired checkout reference." },
      { status: 400 },
    );
  }

  const verified = await verifyPaystackTransaction(reference);
  if (!verified.ok) {
    return NextResponse.json(
      { ok: false, message: "Payment could not be verified yet." },
      { status: 409 },
    );
  }

  try {
    const result = await applyVerifiedTransactionToSubscription({
      userId,
      data: verified.data,
    });

    const [entitlements, billing] = await Promise.all([
      getUserEntitlements(userId),
      getSubscriptionBillingMeta(userId),
    ]);

    return NextResponse.json({
      ok: true,
      activated: result.activated,
      subscription: serializeSubscriptionPayload(entitlements, billing),
    });
  } catch (error) {
    console.error("[billing:confirm]", error);
    return NextResponse.json(
      { ok: false, message: "Could not confirm payment." },
      { status: 500 },
    );
  }
}
