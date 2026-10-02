import { NextResponse } from "next/server";

import { BillingProvider } from "@/generated/prisma/enums";
import { fetchPaystackManageLink } from "@/lib/billing/paystack/manage-subscription";
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
      plan: true,
    },
  });

  if (
    !subscription ||
    subscription.provider !== BillingProvider.PAYSTACK ||
    !subscription.providerSubscriptionId
  ) {
    return NextResponse.json(
      { ok: false, message: "No Paystack subscription to manage." },
      { status: 400 },
    );
  }

  try {
    const manageUrl = await fetchPaystackManageLink(subscription.providerSubscriptionId);
    return NextResponse.json({ ok: true, manageUrl });
  } catch (error) {
    console.error("[billing:manage]", error);
    return NextResponse.json(
      { ok: false, message: "Could not open subscription management." },
      { status: 502 },
    );
  }
}
