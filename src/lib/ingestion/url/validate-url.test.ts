import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseIngestUrl, validateIngestUrlSafety } from "./validate-url";
import { INGEST_URL_MAX_LENGTH } from "./types";

describe("parseIngestUrl — valid URLs", () => {
  it("accepts https article URL", () => {
    const result = parseIngestUrl("https://example.com/article");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.hostname, "example.com");
      assert.equal(result.value.url.protocol, "https:");
    }
  });

  it("accepts http without path", () => {
    assert.equal(parseIngestUrl("http://example.com").ok, true);
  });

  it("accepts explicit port", () => {
    const result = parseIngestUrl("https://example.com:8443/docs");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.url.port, "8443");
    }
  });

  it("accepts subdomain and query", () => {
    const result = parseIngestUrl("https://subdomain.example.com/path?q=test");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.hostname, "subdomain.example.com");
    }
  });
});

describe("parseIngestUrl — invalid URLs", () => {
  it("rejects empty input", () => {
    assert.deepEqual(parseIngestUrl(""), { ok: false, code: "invalid_url" });
    assert.deepEqual(parseIngestUrl("   "), { ok: false, code: "invalid_url" });
  });

  it("rejects non-URL strings", () => {
    assert.equal(parseIngestUrl("not-a-url").ok, false);
  });

  it("rejects disallowed protocols", () => {
    assert.deepEqual(parseIngestUrl("file:///etc/passwd"), {
      ok: false,
      code: "unsupported_protocol",
    });
    assert.deepEqual(parseIngestUrl("ftp://example.com/file"), {
      ok: false,
      code: "unsupported_protocol",
    });
    assert.deepEqual(parseIngestUrl("data:text/plain,test"), {
      ok: false,
      code: "unsupported_protocol",
    });
    assert.deepEqual(parseIngestUrl("javascript:alert(1)"), {
      ok: false,
      code: "unsupported_protocol",
    });
    assert.deepEqual(parseIngestUrl("ws://example.com"), {
      ok: false,
      code: "unsupported_protocol",
    });
    assert.deepEqual(parseIngestUrl("wss://example.com"), {
      ok: false,
      code: "unsupported_protocol",
    });
  });

  it("rejects credentials in URL", () => {
    assert.deepEqual(parseIngestUrl("https://user:pass@example.com"), {
      ok: false,
      code: "credentials_not_allowed",
    });
  });

  it("rejects URLs over max length", () => {
    const long = `https://example.com/${"a".repeat(INGEST_URL_MAX_LENGTH)}`;
    assert.deepEqual(parseIngestUrl(long), { ok: false, code: "url_too_long" });
  });
});

describe("validateIngestUrlSafety — hostname blocking", () => {
  it("rejects localhost variants", async () => {
    for (const url of [
      "http://localhost",
      "http://localhost:3000",
      "http://LOCALHOST",
      "http://localhost.",
      "http://foo.localhost",
    ]) {
      const result = await validateIngestUrlSafety(url);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "blocked_hostname");
      }
    }
  });
});

describe("validateIngestUrlSafety — IPv4 literals", () => {
  it("rejects private and special-use IPv4 in URL", async () => {
    for (const url of [
      "http://127.0.0.1",
      "http://127.20.30.40",
      "http://10.0.0.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://169.254.169.254",
      "http://0.0.0.0",
    ]) {
      const result = await validateIngestUrlSafety(url);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "blocked_ip");
      }
    }
  });

  it("allows public IPv4 literal boundaries", async () => {
    for (const url of ["http://172.15.255.255", "http://172.32.0.1", "http://8.8.8.8"]) {
      const result = await validateIngestUrlSafety(url);
      assert.equal(result.ok, true);
    }
  });
});

describe("validateIngestUrlSafety — DNS (mocked)", () => {
  it("accepts example.com with public IPv4", async () => {
    const result = await validateIngestUrlSafety("https://example.com/article", {
      resolve: async () => ["93.184.216.34"],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.value.resolvedAddresses, ["93.184.216.34"]);
    }
  });

  it("accepts public IPv6 resolution", async () => {
    const result = await validateIngestUrlSafety("https://example.com", {
      resolve: async () => ["2606:2800:220:1:248:1893:25c8:1946"],
    });
    assert.equal(result.ok, true);
  });

  it("rejects when DNS returns loopback", async () => {
    const result = await validateIngestUrlSafety("https://evil.example", {
      resolve: async () => ["169.254.169.254"],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "blocked_ip");
    }
  });

  it("rejects mixed public and private DNS results", async () => {
    const result = await validateIngestUrlSafety("https://mixed.example", {
      resolve: async () => ["8.8.8.8", "10.0.0.4"],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "blocked_ip");
    }
  });

  it("returns dns_resolution_failed on resolver error", async () => {
    const result = await validateIngestUrlSafety("https://dnsfail.example", {
      resolve: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    assert.deepEqual(result, { ok: false, code: "dns_resolution_failed" });
  });
});
