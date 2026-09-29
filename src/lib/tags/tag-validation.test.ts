import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_TAG_NAME_LENGTH } from "./tag-errors";
import {
  parseCreateTagBody,
  parseRenameTagBody,
  validateTagName,
} from "./tag-validation";

describe("validateTagName", () => {
  it("rejects empty and whitespace-only", () => {
    assert.equal(validateTagName(""), "Enter a tag name.");
    assert.equal(validateTagName("   "), "Enter a tag name.");
  });

  it("rejects names over max length", () => {
    const long = "a".repeat(MAX_TAG_NAME_LENGTH + 1);
    assert.match(validateTagName(long) ?? "", /under \d+ characters/);
  });

  it("accepts valid names", () => {
    assert.equal(validateTagName("Programming"), undefined);
    assert.equal(validateTagName("C++"), undefined);
  });
});

describe("parseCreateTagBody", () => {
  it("parses valid create payload", () => {
    const result = parseCreateTagBody({ name: "  Machine   Learning " });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.name, "Machine Learning");
    }
  });

  it("rejects forbidden fields", () => {
    const result = parseCreateTagBody({
      name: "Work",
      userId: "evil",
      normalizedName: "work",
      noteCount: 99,
    });
    assert.equal(result.success, false);
  });
});

describe("parseRenameTagBody", () => {
  it("requires name field", () => {
    const result = parseRenameTagBody({});
    assert.equal(result.success, false);
  });

  it("parses valid rename payload", () => {
    const result = parseRenameTagBody({ name: "Programming" });
    assert.equal(result.success, true);
  });
});
