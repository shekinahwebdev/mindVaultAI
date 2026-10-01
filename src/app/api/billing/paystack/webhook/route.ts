import { NextResponse } from "next/server";

import { isPaystackConfigured } from "@/lib/billing/paystack/config";
import { processPaystackWebhookEvent } from "@/lib/billing/paystack/process-webhook";
import type { PaystackWebhookEvent } from "@/lib/billing/paystack/types";
import { verifyPaystackWebhookSignature } from "@/lib/billing/paystack/verify-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, message: "Invalid signature." }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!event.event || typeof event.event !== "string") {
    return NextResponse.json({ ok: false, message: "Invalid event." }, { status: 400 });
  }

  try {
    await processPaystackWebhookEvent(event);
  } catch (error) {
    console.error("[billing:paystack-webhook]", event.event, error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
