import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertAllAddressesAllowed,
  extractIpv4FromMappedIpv6,
  isBlockedHostname,
  isBlockedIp,
  isBlockedIpv4,
  isBlockedIpv6,
  normalizeHostname,
} from "./is-blocked-host";

describe("normalizeHostname", () => {
  it("lowercases and strips trailing dot", () => {
    assert.equal(normalizeHostname("LOCALHOST."), "localhost");
    assert.equal(normalizeHostname("Example.COM"), "example.com");
  });
});

describe("isBlockedHostname", () => {
  it("blocks localhost and subdomains", () => {
    assert.equal(isBlockedHostname("localhost"), true);
    assert.equal(isBlockedHostname("foo.localhost"), true);
    assert.equal(isBlockedHostname("metadata.google.internal"), true);
    assert.equal(isBlockedHostname("example.com"), false);
  });
});

describe("isBlockedIpv4", () => {
  const blocked = [
    "127.0.0.1",
    "127.20.30.40",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "100.64.0.1",
    "224.0.0.1",
    "240.0.0.1",
  ];

  for (const ip of blocked) {
    it(`blocks ${ip}`, () => {
      assert.equal(isBlockedIpv4(ip), true);
      assert.equal(isBlockedIp(ip), true);
    });
  }

  const allowed = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.255.255", "172.32.0.1"];

  for (const ip of allowed) {
    it(`allows public ${ip}`, () => {
      assert.equal(isBlockedIpv4(ip), false);
      assert.equal(isBlockedIp(ip), false);
    });
  }
});

describe("isBlockedIpv6", () => {
  it("blocks loopback, link-local, ULA, and multicast", () => {
    assert.equal(isBlockedIpv6("::1"), true);
    assert.equal(isBlockedIpv6("fe80::1"), true);
    assert.equal(isBlockedIpv6("fc00::1"), true);
    assert.equal(isBlockedIpv6("fd00::1"), true);
    assert.equal(isBlockedIpv6("ff02::1"), true);
  });

  it("allows public IPv6", () => {
    assert.equal(isBlockedIpv6("2606:2800:220:1:248:1893:25c8:1946"), false);
  });
});

describe("IPv4-mapped IPv6", () => {
  it("extracts dotted mapped form", () => {
    assert.equal(extractIpv4FromMappedIpv6("::ffff:127.0.0.1"), "127.0.0.1");
    assert.equal(extractIpv4FromMappedIpv6("::ffff:10.0.0.1"), "10.0.0.1");
  });

  it("extracts hex mapped form", () => {
    assert.equal(extractIpv4FromMappedIpv6("::ffff:7f00:1"), "127.0.0.1");
    assert.equal(extractIpv4FromMappedIpv6("::ffff:a00:1"), "10.0.0.1");
  });

  it("blocks mapped private IPv4", () => {
    assert.equal(isBlockedIp("::ffff:127.0.0.1"), true);
    assert.equal(isBlockedIp("::ffff:7f00:1"), true);
    assert.equal(isBlockedIp("::ffff:10.0.0.1"), true);
  });
});

describe("assertAllAddressesAllowed", () => {
  it("rejects if any address is blocked", () => {
    assert.deepEqual(assertAllAddressesAllowed(["8.8.8.8", "10.0.0.1"]), {
      ok: false,
      code: "blocked_ip",
    });
    assert.deepEqual(assertAllAddressesAllowed(["8.8.8.8", "1.1.1.1"]), { ok: true });
  });
});
