"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";

import { vaultRoutes } from "@/lib/routes";

import { vaultEase } from "../vault-motion";
import { CaptureForm, type CaptureFormHandle } from "./CaptureForm";

export function CaptureView() {
  const router = useRouter();
  const formRef = useRef<CaptureFormHandle>(null);

  function handleClose() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(vaultRoutes.dashboard);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col"
    >
      <header className="mb-3 flex shrink-0 items-start gap-3">
        <button
          type="button"
          onClick={() => formRef.current?.requestClose()}
          aria-label="Close capture"
          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/55 transition-colors hover:border-white/[0.14] hover:text-white/80"
        >
          <ArrowLeft aria-hidden className="size-4" />
        </button>
        <div className="min-w-0 pt-0.5">
          <p className="text-[0.62rem] tracking-[0.18em] text-white/34 uppercase">
            Capture
          </p>
          <h1 className="font-editorial text-[1.55rem] leading-tight text-brand-ink italic sm:text-[1.85rem]">
            Capture something
          </h1>
          <p className="mt-1 max-w-md text-[0.84rem] leading-snug text-white/42">
            Save what matters now. You can refine and organize it later.
          </p>
        </div>
      </header>

      <CaptureForm ref={formRef} onRequestClose={handleClose} />
    </motion.div>
  );
}
