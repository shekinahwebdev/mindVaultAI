import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ingestUrl } from "./ingest-url";

const ARTICLE_HTML = `<!DOCTYPE html><html><head><title>Example</title></head><body><article><p>${"Readable article paragraph with enough meaningful characters for MindVault ingestion threshold. ".repeat(4)}</p></article></body></html>`;

describe("ingestUrl orchestrator", () => {
  it("composes mocked fetch and extraction into preview", async () => {
    const result = await ingestUrl("https://public.example/article", {
      fetchValidatedUrl: async () => ({
        ok: true,
        value: {
          originalUrl: "https://public.example/article",
          finalUrl: "https://public.example/article",
          status: 200,
          contentType: "text/html",
          body: ARTICLE_HTML,
          byteLength: ARTICLE_HTML.length,
          redirectCount: 0,
        },
      }),
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.preview.title, "Example");
      assert.match(result.preview.content, /Readable article paragraph/);
      assert.equal(result.preview.extractor, "readability");
      assert.doesNotMatch(JSON.stringify(result.preview), /<html>/);
    }
  });

  it("returns fetch-stage failure codes", async () => {
    const result = await ingestUrl("https://public.example/x", {
      fetchValidatedUrl: async () => ({ ok: false, code: "timeout" }),
    });
    assert.deepEqual(result, { ok: false, code: "timeout" });
  });

  it("uses YouTube oEmbed for watch URLs", async () => {
    const result = await ingestUrl("https://www.youtube.com/watch?v=abc123", {
      fetchYouTubeOEmbedPreview: async () => ({
        ok: true,
        value: {
          originalUrl: "https://www.youtube.com/watch?v=abc123",
          finalUrl: "https://www.youtube.com/watch?v=abc123",
          title: "My video",
          authorName: "Creator",
          authorUrl: "https://www.youtube.com/@creator",
          content: "My video\n\nChannel: Creator",
          contentLength: 24,
        },
      }),
      fetchValidatedUrl: async () => {
        throw new Error("HTML fetch should not run for YouTube");
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.preview.extractor, "youtube_oembed");
      assert.deepEqual(result.preview.warnings, ["youtube_oembed", "no_transcript"]);
      assert.equal(result.preview.title, "My video");
    }
  });

  it("returns extract-stage failure codes", async () => {
    const result = await ingestUrl("https://public.example/x", {
      fetchValidatedUrl: async () => ({
        ok: true,
        value: {
          originalUrl: "https://public.example/x",
          finalUrl: "https://public.example/x",
          status: 200,
          contentType: "text/html",
          body: "<html><body><div id='root'></div></body></html>",
          byteLength: 50,
          redirectCount: 0,
        },
      }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "insufficient_content");
    }
  });
});
