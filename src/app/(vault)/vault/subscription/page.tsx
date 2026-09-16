import Link from "next/link";

import { vaultRoutes } from "@/lib/routes";

export default function VaultSubscriptionPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="space-y-2">
        <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
          Subscription & Billing
        </h1>
        <p className="text-[0.88rem] leading-relaxed text-white/46">
          MindVault plans and billing will live here.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-editorial text-[1.1rem] text-brand-ink italic">
          Coming soon
        </p>
        <p className="mt-2 text-[0.86rem] leading-relaxed text-white/42">
          Subscription management and payment processing are not implemented yet.
          This page is reserved for the next development phase.
        </p>
        <Link
          href={vaultRoutes.settings}
          className="mt-5 inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[0.74rem] tracking-[0.12em] text-white/62 uppercase transition-colors hover:border-white/20 hover:text-white/82"
        >
          Back to Settings
        </Link>
      </section>
    </div>
  );
}
