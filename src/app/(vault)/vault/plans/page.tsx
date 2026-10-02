import Link from "next/link";

import { formatStorageBytes } from "@/lib/billing/format";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "@/components/vault/vault-controls";
import { mvPageStackClassName } from "@/lib/mv/layout-tokens";

const planCards = [
  {
    id: "FREE",
    name: "Free",
    description: "Core MindVault for personal knowledge.",
    limits: PLAN_LIMITS.FREE,
    features: [
      "Notes, categories, tags",
      "Keyword & semantic search",
      "Ask MindVault & Analyze with AI (monthly quota)",
      "Export your vault",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    description: "More AI and storage for power users.",
    limits: PLAN_LIMITS.PRO,
    highlighted: true,
    features: [
      "Everything in Free",
      "Higher monthly AI request allowance",
      "More storage for future file uploads",
      "Early access to advanced AI features",
    ],
  },
] as const;

export default function VaultPlansPage() {
  return (
    <div className={cn(mvPageStackClassName, "max-w-3xl")}>
      <header>
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground">Plans</h1>
        <p className="mt-1 text-[0.875rem] text-muted-foreground">
          Compare Free and Pro. Paid checkout is not connected yet — limits below are what your
          account uses today.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {planCards.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "rounded-[var(--mv-radius-card)] border bg-surface p-5",
              "highlighted" in plan && plan.highlighted
                ? "border-[var(--mv-user-accent-border)] ring-1 ring-[var(--mv-user-accent-soft)]"
                : "border-border",
            )}
          >
            <h2 className="text-[1rem] font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">{plan.description}</p>
            <p className="mt-3 text-[0.75rem] font-medium text-foreground">
              {plan.limits.aiRequestsMonthly.toLocaleString()} AI requests / month ·{" "}
              {formatStorageBytes(plan.limits.storageBytes)} storage
            </p>
            <ul className="mt-4 space-y-2 text-[0.8125rem] text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={vaultRoutes.subscription} className={vaultSecondaryButton}>
          Back to subscription
        </Link>
        <Link href={vaultRoutes.subscription} className={vaultPrimaryButton}>
          Upgrade from settings
        </Link>
      </div>
    </div>
  );
}
