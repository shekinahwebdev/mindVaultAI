import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { emptyMigrationCheckpoint } from "./checkpoint";

describe("OpenAI migration checkpoint", () => {
  it("starts from zero counters", () => {
    const checkpoint = emptyMigrationCheckpoint();
    assert.equal(checkpoint.notesProcessed, 0);
    assert.equal(checkpoint.chunksProcessed, 0);
    assert.equal(checkpoint.cancelled, undefined);
  });
});
