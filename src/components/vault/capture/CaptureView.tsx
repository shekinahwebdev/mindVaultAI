"use client";

import { motion } from "framer-motion";
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
      className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col"
    >
      <CaptureForm ref={formRef} onRequestClose={handleClose} />
    </motion.div>
  );
}
