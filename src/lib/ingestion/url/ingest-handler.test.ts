import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { UNAUTHORIZED_MESSAGE } from "@/lib/auth/guards";

import { handleIngestUrlRequest } from "./ingest-handler";
import type { IngestUrlPreview } from "./types";

const session = { userId: "user_test", email: "test@example.com", name: "Test" };

const preview: IngestUrlPreview = {
  originalUrl: "https://public.example/start",
  finalUrl: "https://public.example/article",
  title: "Example",
  content: "Readable text with enough meaningful content for tests in the ingestion handler pipeline validation layer.",
  contentLength: 90,
  extractor: "readability",
  warnings: [],
};

describe("handleIngestUrlRequest — auth", () => {
  it("returns 401 without session", async () => {
    const result = await handleIngestUrlRequest({
      session: null,
      body: { url: "https://example.com" },
    });
    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.message, UNAUTHORIZED_MESSAGE);
    }
  });
});

describe("handleIngestUrlRequest — body validation", () => {
  it("returns 400 for invalid bodies", async () => {
    for (const body of [undefined, { url: "" }, { url: 123 }, "not-json"]) {
      const result = await handleIngestUrlRequest({ session, body });
      assert.equal(result.status, 400);
      assert.equal(result.body.ok, false);
    }
  });
});

describe("handleIngestUrlRequest — success", () => {
  it("returns preview without internal fields", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "https://public.example/article" },
      deps: {
        ingestUrl: async () => ({
          ok: true,
          preview,
          redirectCount: 1,
        }),
      },
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (result.body.ok) {
      assert.deepEqual(result.body.preview, preview);
      assert.equal("resolvedAddresses" in result.body.preview, false);
      assert.doesNotMatch(JSON.stringify(result.body), /resolvedAddresses|rawHtml|<html>/i);
    }
  });
});

describe("handleIngestUrlRequest — security errors", () => {
  it("maps blocked_ip without leaking details", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "http://127.0.0.1/admin" },
      deps: {
        ingestUrl: async () => ({ ok: false, code: "blocked_ip" }),
      },
    });
    assert.equal(result.status, 403);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.message, "This URL can't be imported.");
      assert.doesNotMatch(result.body.message, /127\.0\.0\.1/);
    }
  });
});

describe("handleIngestUrlRequest — fetch errors", () => {
  it("maps timeout to 504", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "https://example.com" },
      deps: { ingestUrl: async () => ({ ok: false, code: "timeout" }) },
    });
    assert.equal(result.status, 504);
  });

  it("maps too_large to 413", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "https://example.com" },
      deps: { ingestUrl: async () => ({ ok: false, code: "too_large" }) },
    });
    assert.equal(result.status, 413);
  });

  it("maps redirect_loop to 502", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "https://example.com" },
      deps: { ingestUrl: async () => ({ ok: false, code: "redirect_loop" }) },
    });
    assert.equal(result.status, 502);
  });
});

describe("handleIngestUrlRequest — extraction errors", () => {
  it("maps insufficient_content to 422", async () => {
    const result = await handleIngestUrlRequest({
      session,
      body: { url: "https://example.com" },
      deps: { ingestUrl: async () => ({ ok: false, code: "insufficient_content" }) },
    });
    assert.equal(result.status, 422);
    if (!result.body.ok) {
      assert.match(result.body.message, /enough readable content/);
    }
  });
});
