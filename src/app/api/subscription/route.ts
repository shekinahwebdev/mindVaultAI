import { NextResponse } from "next/server";

import { getSubscriptionBillingMeta } from "@/lib/billing/billing-meta";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { serializeSubscriptionPayload } from "@/lib/billing/serialize-subscription";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const userId = auth.session.userId;
  const [entitlements, billing] = await Promise.all([
    getUserEntitlements(userId),
    getSubscriptionBillingMeta(userId),
  ]);

  return NextResponse.json({
    ok: true,
    subscription: serializeSubscriptionPayload(entitlements, billing),
  });
}
