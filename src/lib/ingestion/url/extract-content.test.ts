import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractContent, extractContentFromFetch } from "./extract-content";
import { INGEST_EXTRACT_MIN_MEANINGFUL_CHARS } from "./types";
import {
  INGEST_EXTRACT_MAX_CONTENT_CHARS,
  normalizeAndCapExtractedText,
  normalizeExtractedText,
} from "./normalize-content";

const BASE_INPUT = {
  originalUrl: "https://public.example/start",
  finalUrl: "https://public.example/article",
};

function fetchValue(body: string, contentType: string) {
  return {
    ...BASE_INPUT,
    status: 200,
    contentType,
    body,
    byteLength: body.length,
    redirectCount: 0,
  };
}

const ARTICLE_HTML = `<!DOCTYPE html>
<html>
<head><title>Understanding Transformers</title></head>
<body>
<nav>Home Pricing Login</nav>
<article>
<h1>Understanding Transformers</h1>
<p>Transformers are neural network architectures that rely on attention mechanisms to model relationships between tokens in a sequence without relying on recurrence.</p>
<p>They use attention to weigh the importance of different parts of the input when producing each output element, which makes them highly parallelizable during training.</p>
</article>
<footer>Privacy Terms</footer>
</body>
</html>`;

describe("normalizeExtractedText", () => {
  it("normalizes line endings and collapses blank lines", () => {
    const input = "  line one\r\n\r\n\r\n\r\nline two  ";
    assert.equal(normalizeExtractedText(input), "line one\n\nline two");
  });

  it("caps with truncated warning", () => {
    const long = "a".repeat(INGEST_EXTRACT_MAX_CONTENT_CHARS + 50);
    const result = normalizeAndCapExtractedText(long);
    assert.equal(result.text.length, INGEST_EXTRACT_MAX_CONTENT_CHARS);
    assert.deepEqual(result.warnings, ["truncated"]);
  });
});

describe("article extraction", () => {
  it("extracts title and article text without nav/footer noise", () => {
    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html; charset=utf-8",
      body: ARTICLE_HTML,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.title, "Understanding Transformers");
      assert.equal(result.value.extractor, "readability");
      assert.match(result.value.content, /Transformers are neural network architectures/);
      assert.match(result.value.content, /attention to weigh the importance/);
      assert.doesNotMatch(result.value.content, /Privacy Terms/);
      assert.doesNotMatch(result.value.content, /Home Pricing Login/);
    }
  });

  it("works via extractContentFromFetch", () => {
    const result = extractContentFromFetch(
      fetchValue(ARTICLE_HTML, "text/html; charset=utf-8"),
    );
    assert.equal(result.ok, true);
  });
});

describe("noise-heavy page", () => {
  it("prefers article body over nav and cookie banner", () => {
    const html = `<!DOCTYPE html><html><head><title>Site</title></head><body>
<nav>${"Menu ".repeat(40)}</nav>
<div class="cookie">We use cookies for everything imaginable and more.</div>
<style>.hidden{display:none}</style>
<script>window.tracking = true</script>
<article>
<h1>Real story</h1>
<p>${"This is the meaningful article body about an important topic that readers came for. ".repeat(4)}</p>
</article>
<footer>${"Footer link ".repeat(30)}</footer>
</body></html>`;

    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.value.content, /meaningful article body/);
      assert.doesNotMatch(result.value.content, /window\.tracking/);
    }
  });
});

describe("text/plain", () => {
  it("normalizes plain text without DOM extraction", () => {
    const body = `Plain notes line one.

Line two with enough meaningful content to pass the minimum threshold for ingestion extraction in MindVault tests. ${"Additional plain-text detail. ".repeat(8)}`;
    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/plain",
      body,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.extractor, "plain_text");
      assert.equal(result.value.title, null);
      assert.match(result.value.content, /Plain notes line one/);
    }
  });
});

describe("SPA shell", () => {
  it("returns insufficient_content for empty JS app shell", () => {
    const html = `<!DOCTYPE html><html><head><title>App</title></head><body>
<div id="root"></div>
<script src="app.js"></script>
</body></html>`;

    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "insufficient_content");
    }
  });
});

describe("truncation", () => {
  it("truncates normalized content and adds warning", () => {
    const paragraph = "Word ".repeat(30_000);
    const html = `<!DOCTYPE html><html><head><title>Long</title></head><body><article><p>${paragraph}</p></article></body></html>`;

    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.content.length, INGEST_EXTRACT_MAX_CONTENT_CHARS);
      assert.ok(result.value.warnings.includes("truncated"));
    }
  });
});

describe("malformed HTML", () => {
  it("recovers or fails safely without throwing", () => {
    const html = `<html><head><title>Broken</title><body><article><p>Unclosed paragraph and content that is still long enough to qualify when readability or fallback can find it in the document structure.</p>`;
    assert.doesNotThrow(() => {
      const result = extractContent({
        ...BASE_INPUT,
        contentType: "text/html",
        body: html,
      });
      assert.ok(result.ok === true || result.ok === false);
    });
  });
});

describe("script safety", () => {
  it("does not execute inline script during parse", () => {
    const html = `<!DOCTYPE html><html><body><article><p>${"Safe readable paragraph with sufficient length for extraction validation in MindVault ingestion pipeline testing. ".repeat(3)}</p><script>throw new Error("should not execute")</script></article></body></html>`;

    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });

    assert.equal(result.ok, true);
  });

  it("ignores event handler attributes", () => {
    const html = `<!DOCTYPE html><html><body><article><p onclick="throw new Error('nope')">${"Event handler attributes should not run in linkedom static parse. ".repeat(6)}</p></article></body></html>`;
    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });
    assert.equal(result.ok, true);
  });
});

describe("documentation-like page", () => {
  it("extracts main prose from docs-style HTML", () => {
    const html = `<!DOCTYPE html><html><head><title>API Reference</title></head><body>
<nav>Docs / API / Auth</nav>
<main>
<h1>Authentication</h1>
<p>${"Use bearer tokens for API access. Send the Authorization header on each request with a valid token issued by the auth service. ".repeat(2)}</p>
</main>
</body></html>`;

    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.value.content, /bearer tokens/);
    }
  });
});

describe("minimum content threshold", () => {
  it("rejects boilerplate-only pages", () => {
    const html = `<!DOCTYPE html><html><body><nav>Home Login Menu</nav></body></html>`;
    const result = extractContent({
      ...BASE_INPUT,
      contentType: "text/html",
      body: html,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "insufficient_content");
    }
  });

  it("documents minimum meaningful character constant", () => {
    assert.equal(INGEST_EXTRACT_MIN_MEANINGFUL_CHARS, 150);
  });
});
