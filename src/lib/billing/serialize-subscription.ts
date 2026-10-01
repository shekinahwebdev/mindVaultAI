import type { UserEntitlements } from "./entitlements";
import type { getSubscriptionBillingMeta } from "./billing-meta";

export type SerializedSubscriptionResponse = {
  plan: UserEntitlements["plan"];
  status: string;
  usage: {
    aiRequests: UserEntitlements["aiRequests"];
    storage: UserEntitlements["storage"];
  };
  entitlements: UserEntitlements["features"];
  billing: Awaited<ReturnType<typeof getSubscriptionBillingMeta>>;
};

export function serializeSubscriptionPayload(
  entitlements: UserEntitlements,
  billing: SerializedSubscriptionResponse["billing"],
): SerializedSubscriptionResponse {
  return {
    plan: entitlements.plan,
    status: entitlements.status,
    usage: {
      aiRequests: entitlements.aiRequests,
      storage: entitlements.storage,
    },
    entitlements: entitlements.features,
    billing,
  };
}
