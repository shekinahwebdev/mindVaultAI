import { lookup } from "node:dns/promises";

import type { HostResolver, UrlSafetyFailure } from "./types";

/**
 * Server-only: uses Node DNS. Do not import from client components.
 */

export const defaultHostResolver: HostResolver = async (hostname) => {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
};

export type ResolveHostResult =
  | { ok: true; addresses: string[] }
  | UrlSafetyFailure;

/**
 * Resolves all A and AAAA records (via lookup all: true).
 * Caller must classify every address — see assertAllAddressesAllowed().
 */
export async function resolveHostAddresses(
  hostname: string,
  resolver: HostResolver = defaultHostResolver,
): Promise<ResolveHostResult> {
  try {
    const addresses = await resolver(hostname);
    if (addresses.length === 0) {
      return { ok: false, code: "dns_resolution_failed" };
    }
    return { ok: true, addresses };
  } catch {
    return { ok: false, code: "dns_resolution_failed" };
  }
}
