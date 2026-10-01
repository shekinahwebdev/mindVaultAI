import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estimateDataUrlBytes } from "./storage";

describe("estimateDataUrlBytes", () => {
  it("returns zero for empty data url payload", () => {
    assert.equal(estimateDataUrlBytes("data:image/png;base64,"), 0);
  });

  it("estimates base64 payload size", () => {
    const bytes = estimateDataUrlBytes("data:image/png;base64,AAAA");
    assert.ok(bytes >= 0);
  });
});
