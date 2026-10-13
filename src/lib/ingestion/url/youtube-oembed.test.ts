import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildYouTubeIngestContent,
  canonicalYouTubeWatchUrl,
  fetchYouTubeOEmbedPreview,
  parseYouTubeIngestUrl,
} from "./youtube-oembed";

describe("parseYouTubeIngestUrl", () => {
  it("accepts watch, youtu.be, and shorts URLs", () => {
    assert.ok(parseYouTubeIngestUrl("https://www.youtube.com/watch?v=abc123_XYZ-1"));
    assert.ok(parseYouTubeIngestUrl("https://youtu.be/abc123_XYZ-1"));
    assert.ok(parseYouTubeIngestUrl("https://www.youtube.com/shorts/abc123_XYZ-1"));
  });

  it("rejects non-video YouTube pages", () => {
    assert.equal(parseYouTubeIngestUrl("https://www.youtube.com/feed/subscriptions"), null);
    assert.equal(parseYouTubeIngestUrl("https://example.com/watch?v=abc"), null);
  });
});

describe("canonicalYouTubeWatchUrl", () => {
  it("normalizes youtu.be links", () => {
    const url = parseYouTubeIngestUrl("https://youtu.be/dQw4w9WgXcQ");
    assert.ok(url);
    assert.equal(
      canonicalYouTubeWatchUrl(url),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});

describe("fetchYouTubeOEmbedPreview", () => {
  it("maps oEmbed JSON into ingest preview fields", async () => {
    const result = await fetchYouTubeOEmbedPreview(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      {
        fetchFn: async () =>
          new Response(
            JSON.stringify({
              title: "Example video",
              author_name: "Example channel",
              author_url: "https://www.youtube.com/@example",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.title, "Example video");
      assert.match(result.value.content, /Example channel/);
      assert.match(result.value.content, /not the transcript/);
    }
  });
});

describe("buildYouTubeIngestContent", () => {
  it("includes watch URL", () => {
    const content = buildYouTubeIngestContent({
      title: "T",
      authorName: "A",
      watchUrl: "https://www.youtube.com/watch?v=x",
    });
    assert.match(content, /https:\/\/www\.youtube\.com\/watch\?v=x/);
  });
});
