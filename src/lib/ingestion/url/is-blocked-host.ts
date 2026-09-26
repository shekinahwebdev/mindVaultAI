import { BlockList, isIP } from "node:net";

import type { UrlSafetyFailure } from "./types";

/**
 * IPv4 ranges blocked for server-side fetch: private, loopback, link-local,
 * metadata-style link-local, CGNAT, multicast, and reserved space.
 * Goal: public internet destinations only (not reachable internal networks).
 */
const blockedIpv4 = new BlockList();
blockedIpv4.addSubnet("0.0.0.0", 8, "ipv4");
blockedIpv4.addSubnet("10.0.0.0", 8, "ipv4");
blockedIpv4.addSubnet("100.64.0.0", 10, "ipv4");
blockedIpv4.addSubnet("127.0.0.0", 8, "ipv4");
blockedIpv4.addSubnet("169.254.0.0", 16, "ipv4");
blockedIpv4.addSubnet("172.16.0.0", 12, "ipv4");
blockedIpv4.addSubnet("192.168.0.0", 16, "ipv4");
blockedIpv4.addSubnet("224.0.0.0", 4, "ipv4");
blockedIpv4.addSubnet("240.0.0.0", 4, "ipv4");

/**
 * IPv6: loopback, unique-local, link-local, multicast.
 * IPv4-mapped addresses are handled separately via isBlockedIp().
 */
const blockedIpv6 = new BlockList();
blockedIpv6.addSubnet("::1", 128, "ipv6");
blockedIpv6.addSubnet("fc00::", 7, "ipv6");
blockedIpv6.addSubnet("fe80::", 10, "ipv6");
blockedIpv6.addSubnet("ff00::", 8, "ipv6");

const BLOCKED_METADATA_HOSTNAMES = new Set([
  "metadata.google.internal",
]);

/**
 * Normalize hostname for comparisons (URL.hostname is already lowercase for ASCII).
 * Strips a single trailing dot from FQDN-style hostnames.
 */
export function normalizeHostname(hostname: string): string {
  const trimmed = hostname.trim().toLowerCase();
  return trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (normalized === "localhost") {
    return true;
  }

  if (normalized.endsWith(".localhost")) {
    return true;
  }

  if (BLOCKED_METADATA_HOSTNAMES.has(normalized)) {
    return true;
  }

  return false;
}

/**
 * Extracts an IPv4 address from IPv4-mapped IPv6 forms such as ::ffff:127.0.0.1
 * (including the fully expanded ::ffff:0:… form returned by some resolvers).
 */
export function extractIpv4FromMappedIpv6(address: string): string | null {
  const kind = isIP(address);
  if (kind !== 6) {
    return null;
  }

  const lower = address.toLowerCase();

  if (lower.startsWith("::ffff:")) {
    const suffix = lower.slice("::ffff:".length);
    if (isIP(suffix) === 4) {
      return suffix;
    }

    const hexMapped = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(suffix);
    if (hexMapped) {
      const hi = Number.parseInt(hexMapped[1]!, 16);
      const lo = Number.parseInt(hexMapped[2]!, 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      }
    }
  }

  return null;
}

export function isBlockedIpv4(address: string): boolean {
  if (isIP(address) !== 4) {
    return false;
  }
  return blockedIpv4.check(address, "ipv4");
}

export function isBlockedIpv6(address: string): boolean {
  if (isIP(address) !== 6) {
    return false;
  }
  return blockedIpv6.check(address, "ipv6");
}

/**
 * Returns true when the address must not be fetched (conservative for unknown shapes).
 */
export function isBlockedIp(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) {
    return isBlockedIpv4(address);
  }
  if (kind === 6) {
    const mapped = extractIpv4FromMappedIpv6(address);
    if (mapped && isBlockedIpv4(mapped)) {
      return true;
    }
    return isBlockedIpv6(address);
  }
  return true;
}

export function assertAllAddressesAllowed(
  addresses: string[],
): { ok: true } | UrlSafetyFailure {
  for (const address of addresses) {
    if (isBlockedIp(address)) {
      return { ok: false, code: "blocked_ip" };
    }
  }
  return { ok: true };
}
