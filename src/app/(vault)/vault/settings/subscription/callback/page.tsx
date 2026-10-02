import { Suspense } from "react";

import { SubscriptionCallbackClient } from "./SubscriptionCallbackClient";

export default function SubscriptionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-[0.875rem] text-muted-foreground">
          Confirming your subscription…
        </div>
      }
    >
      <SubscriptionCallbackClient />
    </Suspense>
  );
}
