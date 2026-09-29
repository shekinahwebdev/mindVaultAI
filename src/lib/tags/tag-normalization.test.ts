import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeTagDisplayName,
  normalizeTagFields,
  normalizeTagName,
} from "./tag-normalization";

describe("normalizeTagDisplayName", () => {
  it("trims and collapses whitespace", () => {
    assert.equal(normalizeTagDisplayName("   Machine   Learning "), "Machine Learning");
  });

  it("preserves punctuation and casing", () => {
    assert.equal(normalizeTagDisplayName("C++"), "C++");
    assert.equal(normalizeTagDisplayName("Node.js"), "Node.js");
    assert.equal(normalizeTagDisplayName("Programming"), "Programming");
  });
});

describe("normalizeTagName", () => {
  it("lowercases display form", () => {
    assert.equal(normalizeTagName("Programming"), "programming");
    assert.equal(normalizeTagName("Machine Learning"), "machine learning");
    assert.equal(normalizeTagName("C++"), "c++");
    assert.equal(normalizeTagName("Node.js"), "node.js");
  });

  it("normalizes whitespace before lowercasing", () => {
    assert.equal(normalizeTagName(" programming "), "programming");
    assert.equal(normalizeTagName("Machine    Learning"), "machine learning");
  });
});

describe("normalizeTagFields", () => {
  it("returns paired display and canonical values", () => {
    assert.deepEqual(normalizeTagFields("Programming"), {
      name: "Programming",
      normalizedName: "programming",
    });
  });
});
