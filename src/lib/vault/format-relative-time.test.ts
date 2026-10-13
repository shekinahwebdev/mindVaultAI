import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatRelativeTime,
  formatRelativeTimeAnchor,
} from "./format-relative-time";

describe("formatRelativeTimeAnchor", () => {
  it("uses a fixed UTC short date for hydration", () => {
    assert.equal(
      formatRelativeTimeAnchor("2025-09-30T12:00:00.000Z"),
      "Sep 30",
    );
  });
});

describe("formatRelativeTime", () => {
  it("matches anchor for dates older than seven days", () => {
    const iso = "2020-01-15T12:00:00.000Z";
    assert.equal(formatRelativeTime(iso), formatRelativeTimeAnchor(iso));
  });
});
