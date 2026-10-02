import { NextResponse } from "next/server";

import { BillingProvider } from "@/generated/prisma/enums";
import { disablePaystackSubscription } from "@/lib/billing/paystack/manage-subscription";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function POST() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.session.userId },
    select: {
      provider: true,
      providerSubscriptionId: true,
      providerEmailToken: true,
    },
  });

  if (
    !subscription?.providerSubscriptionId ||
    !subscription.providerEmailToken ||
    subscription.provider !== BillingProvider.PAYSTACK
  ) {
    return NextResponse.json(
      { ok: false, message: "No active Paystack subscription to cancel." },
      { status: 400 },
    );
  }

  try {
    await disablePaystackSubscription({
      code: subscription.providerSubscriptionId,
      emailToken: subscription.providerEmailToken,
    });
    return NextResponse.json({
      ok: true,
      message: "Cancellation requested with Paystack. Your plan will update when confirmed.",
    });
  } catch (error) {
    console.error("[billing:cancel]", error);
    return NextResponse.json(
      { ok: false, message: "Could not cancel subscription." },
      { status: 502 },
    );
  }
}
