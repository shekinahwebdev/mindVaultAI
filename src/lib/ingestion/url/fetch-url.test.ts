import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyContentType,
  createPinnedDispatcher,
  defaultPinnedFetch,
  fetchValidatedUrl,
  looksLikeBinaryBody,
  readBodyWithByteLimit,
  type PinnedFetchFn,
} from "./fetch-url";
const PUBLIC_IP = "203.0.113.10";

function htmlResponse(body = "<html>ok</html>", status = 200, headers?: HeadersInit) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...Object.fromEntries(new Headers(headers ?? {}).entries()),
    },
  });
}

function redirectResponse(location: string, status = 302) {
  return new Response(null, {
    status,
    headers: { location },
  });
}

describe("classifyContentType", () => {
  it("accepts html, xhtml, plain with charset", () => {
    assert.equal(classifyContentType("text/html; charset=utf-8"), null);
    assert.equal(classifyContentType("application/xhtml+xml"), null);
    assert.equal(classifyContentType("text/plain"), null);
  });

  it("rejects pdf, images, octet-stream, video", () => {
    assert.equal(classifyContentType("application/pdf"), "unsupported_content");
    assert.equal(classifyContentType("image/png"), "unsupported_content");
    assert.equal(classifyContentType("application/octet-stream"), "unsupported_content");
    assert.equal(classifyContentType("video/mp4"), "unsupported_content");
  });
});

describe("readBodyWithByteLimit", () => {
  it("rejects when Content-Length exceeds cap", async () => {
    const response = new Response("x", {
      headers: { "content-length": "999" },
    });
    const result = await readBodyWithByteLimit(response, 100);
    assert.deepEqual(result, { ok: false, code: "too_large" });
  });

  it("aborts streamed body exceeding cap", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(150));
        controller.close();
      },
    });
    const response = new Response(stream);
    const result = await readBodyWithByteLimit(response, 100);
    assert.deepEqual(result, { ok: false, code: "too_large" });
  });

  it("returns body under cap", async () => {
    const response = new Response("hello");
    const result = await readBodyWithByteLimit(response, 100);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.byteLength, 5);
    }
  });
});

describe("looksLikeBinaryBody", () => {
  it("detects null bytes and PDF signature", () => {
    assert.equal(looksLikeBinaryBody(new TextEncoder().encode("hello")), false);
    assert.equal(looksLikeBinaryBody(new TextEncoder().encode("%PDF-1.4")), true);
    assert.equal(looksLikeBinaryBody(new Uint8Array([0, 1, 2])), true);
  });
});

describe("fetchValidatedUrl — success", () => {
  it("returns HTML body and metadata", async () => {
    const pinnedFetch: PinnedFetchFn = async () => htmlResponse("<html>article</html>");

    const result = await fetchValidatedUrl("https://public.example/article", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.status, 200);
      assert.equal(result.value.contentType, "text/html");
      assert.match(result.value.body, /article/);
      assert.equal(result.value.redirectCount, 0);
    }
  });

  it("accepts text/plain", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      new Response("plain text", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

    const result = await fetchValidatedUrl("https://public.example/note.txt", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });
    assert.equal(result.ok, true);
  });

  it("accepts application/xhtml+xml", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      new Response("<html/>", {
        status: 200,
        headers: { "content-type": "application/xhtml+xml" },
      });

    const result = await fetchValidatedUrl("https://public.example/x", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });
    assert.equal(result.ok, true);
  });
});

describe("fetchValidatedUrl — redirects", () => {
  it("follows public redirect chain", async () => {
    let calls = 0;
    const pinnedFetch: PinnedFetchFn = async (ctx) => {
      calls += 1;
      if (ctx.url.hostname === "public.example") {
        return redirectResponse("https://cdn.example/article");
      }
      return htmlResponse("<html>final</html>");
    };

    const result = await fetchValidatedUrl("https://public.example/start", {
      resolve: async (hostname) => {
        if (hostname === "public.example" || hostname === "cdn.example") {
          return [PUBLIC_IP];
        }
        return ["1.1.1.1"];
      },
      pinnedFetch,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.redirectCount, 1);
      assert.equal(result.value.finalUrl, "https://cdn.example/article");
    }
    assert.equal(calls, 2);
  });

  it("blocks redirect to loopback before second fetch", async () => {
    let secondHop = false;
    const pinnedFetch: PinnedFetchFn = async () => {
      if (secondHop) {
        throw new Error("must not fetch private host");
      }
      secondHop = true;
      return redirectResponse("http://127.0.0.1/admin");
    };

    const result = await fetchValidatedUrl("https://public.example/start", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "blocked_ip");
    }
    assert.equal(secondHop, true);
  });

  it("blocks redirect to link-local metadata IP", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      redirectResponse("http://169.254.169.254/latest/meta-data");

    const result = await fetchValidatedUrl("https://public.example/start", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "blocked_ip");
    }
  });

  it("rejects redirect loops", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      redirectResponse("https://loop.example/");

    const result = await fetchValidatedUrl("https://loop.example/", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
      maxRedirects: 5,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "redirect_loop");
    }
  });

  it("rejects exceeding max redirects", async () => {
    let hops = 0;
    const pinnedFetch: PinnedFetchFn = async (ctx) => {
      hops += 1;
      return redirectResponse(`https://hop.example/${hops}`);
    };

    const result = await fetchValidatedUrl("https://hop.example/0", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
      maxRedirects: 2,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "redirect_limit");
    }
  });

  it("resolves relative Location against current URL", async () => {
    const pinnedFetch: PinnedFetchFn = async (ctx) => {
      if (ctx.url.pathname === "/docs") {
        return redirectResponse("../article");
      }
      return htmlResponse("<html>rel</html>");
    };

    const result = await fetchValidatedUrl("https://public.example/docs", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.finalUrl, "https://public.example/article");
    }
  });
});

describe("fetchValidatedUrl — size and timeout", () => {
  it("returns too_large when Content-Length exceeds cap", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      new Response("ignored", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-length": "5000",
        },
      });

    const result = await fetchValidatedUrl("https://public.example/big", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
      maxBodyBytes: 100,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "too_large");
    }
  });

  it("returns too_large for streaming body over cap", async () => {
    const pinnedFetch: PinnedFetchFn = async () => {
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(new Uint8Array(200));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    };

    const result = await fetchValidatedUrl("https://public.example/stream", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
      maxBodyBytes: 100,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "too_large");
    }
  });

  it("times out when pinnedFetch hangs", async () => {
    const pinnedFetch: PinnedFetchFn = async ({ signal }) =>
      new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });

    const result = await fetchValidatedUrl("https://public.example/slow", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
      timeoutMs: 30,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "timeout");
    }
  });
});

describe("fetchValidatedUrl — content types and binary", () => {
  it("rejects unsupported content types", async () => {
    for (const contentType of [
      "application/pdf",
      "image/png",
      "application/octet-stream",
      "video/mp4",
    ]) {
      const pinnedFetch: PinnedFetchFn = async () =>
        new Response("data", { status: 200, headers: { "content-type": contentType } });

      const result = await fetchValidatedUrl("https://public.example/file", {
        resolve: async () => [PUBLIC_IP],
        pinnedFetch,
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "unsupported_content");
      }
    }
  });

  it("rejects binary body despite text/html content-type", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      new Response("%PDF-1.4 fake", {
        status: 200,
        headers: { "content-type": "text/html" },
      });

    const result = await fetchValidatedUrl("https://public.example/fake", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "binary_content");
    }
  });
});

describe("connection pinning", () => {
  it("uses only validated addresses in pinnedFetch", async () => {
    let resolveCalls = 0;

    const connected: string[] = [];
    const pinnedFetch: PinnedFetchFn = async (ctx) => {
      connected.push(ctx.pinnedAddress);
      return htmlResponse();
    };

    const result = await fetchValidatedUrl("https://safe.example/page", {
      resolve: async () => {
        resolveCalls += 1;
        return [PUBLIC_IP];
      },
      pinnedFetch,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(connected, [PUBLIC_IP]);
    assert.equal(resolveCalls, 1);
  });

  it("createPinnedDispatcher is used by defaultPinnedFetch wiring", () => {
    assert.equal(typeof createPinnedDispatcher, "function");
    assert.equal(typeof defaultPinnedFetch, "function");
  });
});

describe("fetchValidatedUrl — HTTP errors", () => {
  it("returns fetch_failed for 404", async () => {
    const pinnedFetch: PinnedFetchFn = async () =>
      new Response("missing", { status: 404, headers: { "content-type": "text/html" } });

    const result = await fetchValidatedUrl("https://public.example/missing", {
      resolve: async () => [PUBLIC_IP],
      pinnedFetch,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "fetch_failed");
      assert.equal(result.status, 404);
    }
  });
});
