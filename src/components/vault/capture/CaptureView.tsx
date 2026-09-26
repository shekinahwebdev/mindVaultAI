"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";

import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  vaultEyebrowClassName,
  vaultIconButton,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
} from "../vault-controls";

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
          className={vaultIconButton}
        >
          <ArrowLeft aria-hidden className="size-4" />
        </button>
        <div className="min-w-0 pt-0.5">
          <p className={vaultEyebrowClassName}>Capture</p>
          <h1 className={vaultPageTitleClassName}>Capture something</h1>
          <p className={cn(vaultPageLeadClassName, "mt-1 max-w-md")}>
            Save what matters now. You can refine and organize it later.
          </p>
        </div>
      </header>

      <CaptureForm ref={formRef} onRequestClose={handleClose} />
    </motion.div>
  );
}
