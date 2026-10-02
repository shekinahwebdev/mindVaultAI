"use client";

import type { SerializedSubscriptionResponse } from "./serialize-subscription";

export async function startPaystackCheckout(): Promise<
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: true; alreadyPro: true; message: string }
  | { ok: false; message?: string }
> {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    credentials: "include",
  });
  const data = (await response.json()) as {
    ok: boolean;
    authorizationUrl?: string;
    reference?: string;
    alreadyPro?: boolean;
    message?: string;
  };
  if (!data.ok) {
    return { ok: false, message: data.message };
  }
  if (data.alreadyPro) {
    return { ok: true, alreadyPro: true, message: data.message ?? "Already Pro." };
  }
  if (!data.authorizationUrl || !data.reference) {
    return { ok: false, message: "Invalid checkout response." };
  }
  return {
    ok: true,
    authorizationUrl: data.authorizationUrl,
    reference: data.reference,
  };
}

export async function confirmPaystackCheckout(reference: string): Promise<
  | { ok: true; subscription: SerializedSubscriptionResponse; activated: boolean }
  | { ok: false; message?: string }
> {
  const response = await fetch("/api/billing/confirm", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  const data = (await response.json()) as {
    ok: boolean;
    subscription?: SerializedSubscriptionResponse;
    activated?: boolean;
    message?: string;
  };
  if (!data.ok || !data.subscription) {
    return { ok: false, message: data.message };
  }
  return {
    ok: true,
    subscription: data.subscription,
    activated: Boolean(data.activated),
  };
}

export async function fetchPaystackManageUrl(): Promise<
  { ok: true; manageUrl: string } | { ok: false; message?: string }
> {
  const response = await fetch("/api/billing/manage", {
    method: "POST",
    credentials: "include",
  });
  const data = (await response.json()) as {
    ok: boolean;
    manageUrl?: string;
    message?: string;
  };
  if (!data.ok || !data.manageUrl) {
    return { ok: false, message: data.message };
  }
  return { ok: true, manageUrl: data.manageUrl };
}

export async function cancelPaystackSubscription(): Promise<
  { ok: true; message: string } | { ok: false; message?: string }
> {
  const response = await fetch("/api/billing/cancel", {
    method: "POST",
    credentials: "include",
  });
  const data = (await response.json()) as { ok: boolean; message?: string };
  if (!data.ok) {
    return { ok: false, message: data.message };
  }
  return { ok: true, message: data.message ?? "Cancellation requested." };
}
