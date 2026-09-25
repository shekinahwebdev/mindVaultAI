import { Suspense } from "react";

import { CaptureView } from "@/components/vault/capture/CaptureView";

export default function CapturePage() {
  return (
    <Suspense fallback={null}>
      <CaptureView />
    </Suspense>
  );
}
