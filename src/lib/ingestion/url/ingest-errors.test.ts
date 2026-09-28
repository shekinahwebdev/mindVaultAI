import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ingestFailureHttpStatus,
  ingestFailureMessage,
  INGEST_CLIENT_MESSAGES,
} from "./ingest-errors";

describe("ingest error mapping", () => {
  it("maps validation errors to 400", () => {
    assert.equal(ingestFailureHttpStatus("invalid_url"), 400);
    assert.equal(ingestFailureHttpStatus("unsupported_protocol"), 400);
  });

  it("maps blocked destinations to 403", () => {
    assert.equal(ingestFailureHttpStatus("blocked_ip"), 403);
    assert.equal(ingestFailureHttpStatus("blocked_hostname"), 403);
  });

  it("maps timeout to 504 and too_large to 413", () => {
    assert.equal(ingestFailureHttpStatus("timeout"), 504);
    assert.equal(ingestFailureHttpStatus("too_large"), 413);
  });

  it("maps unsupported media to 415 and extraction to 422", () => {
    assert.equal(ingestFailureHttpStatus("unsupported_content"), 415);
    assert.equal(ingestFailureHttpStatus("insufficient_content"), 422);
  });

  it("uses non-leaking client messages", () => {
    for (const message of Object.values(INGEST_CLIENT_MESSAGES)) {
      assert.doesNotMatch(message, /10\.\d+\.\d+\.\d+/);
      assert.doesNotMatch(message, /127\.0\.0\.1/);
    }
    assert.equal(
      ingestFailureMessage("blocked_ip"),
      "This URL can't be imported.",
    );
  });
});
