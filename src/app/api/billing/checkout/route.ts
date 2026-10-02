import { NextResponse } from "next/server";

import {
  BillingProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/generated/prisma/enums";
import { isPaystackCheckoutEnabled } from "@/lib/billing/paystack/config";
import { initializePaystackProCheckout } from "@/lib/billing/paystack/initialize-checkout";
import {
  buildCheckoutReference,
} from "@/lib/billing/paystack/sync-subscription";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { resolveEffectivePlan } from "@/lib/billing/subscription-repository";

export async function POST() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  if (!isPaystackCheckoutEnabled()) {
    return NextResponse.json(
      { ok: false, message: "Checkout is not available." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.session.userId },
    select: { id: true, email: true },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      plan: true,
      status: true,
      provider: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (
    subscription &&
    resolveEffectivePlan(subscription) === SubscriptionPlan.PRO
  ) {
    return NextResponse.json({
      ok: true,
      alreadyPro: true,
      message: "You are already on MindVault Pro.",
    });
  }

  const reference = buildCheckoutReference(user.id);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      provider: BillingProvider.NONE,
      pendingCheckoutReference: reference,
    },
    update: {
      pendingCheckoutReference: reference,
    },
  });

  try {
    const checkout = await initializePaystackProCheckout({
      email: user.email,
      userId: user.id,
      reference,
    });

    return NextResponse.json({
      ok: true,
      authorizationUrl: checkout.authorization_url,
      reference: checkout.reference,
    });
  } catch (error) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { pendingCheckoutReference: null },
    });
    console.error("[billing:checkout]", error);
    return NextResponse.json(
      { ok: false, message: "Could not start checkout. Try again later." },
      { status: 502 },
    );
  }
}
