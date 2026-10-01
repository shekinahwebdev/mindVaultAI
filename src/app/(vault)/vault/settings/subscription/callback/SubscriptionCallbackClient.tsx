"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { confirmPaystackCheckout } from "@/lib/billing/billing-client";
import { planDisplayName } from "@/lib/billing/plans";
import { vaultRoutes } from "@/lib/routes";

import { vaultSecondaryButton } from "@/components/vault/vault-controls";

type CallbackState = "confirming" | "success" | "pending" | "error";

export function SubscriptionCallbackClient() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const [state, setState] = useState<CallbackState>("confirming");
  const [message, setMessage] = useState("Confirming your subscription…");

  useEffect(() => {
    if (!reference) {
      setState("error");
      setMessage("Missing payment reference.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const result = await confirmPaystackCheckout(reference);
      if (cancelled) {
        return;
      }

      if (result.ok && result.subscription.plan === "PRO") {
        setState("success");
        setMessage(`You're now on ${planDisplayName("PRO")}.`);
        return;
      }

      if (attempts < 8) {
        setState("pending");
        setMessage("Confirming your subscription…");
        window.setTimeout(() => void poll(), 2000);
        return;
      }

      setState("error");
      setMessage(
        result.ok
          ? "Payment received — open subscription settings to refresh status."
          : result.message || "Could not confirm payment.",
      );
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-8">
      <h1 className="text-[1.25rem] font-semibold text-foreground">Subscription</h1>
      <p className="text-[0.875rem] text-muted-foreground">{message}</p>
      {state === "pending" || state === "confirming" ? (
        <p className="text-[0.75rem] text-mv-faint">
          Paystack may take a moment. Webhook confirmation can require a public URL in dev.
        </p>
      ) : null}
      <Link href={vaultRoutes.subscription} className={vaultSecondaryButton}>
        Back to subscription settings
      </Link>
    </div>
  );
}
