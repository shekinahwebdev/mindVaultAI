import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createWorkerId } from "./worker-run";

describe("createWorkerId", () => {
  it("returns a unique worker identity string", () => {
    const a = createWorkerId("test-host");
    const b = createWorkerId("test-host");
    assert.notEqual(a, b);
    assert.match(a, /test-host-/);
  });
});
