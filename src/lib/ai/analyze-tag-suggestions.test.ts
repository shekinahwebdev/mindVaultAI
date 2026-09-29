import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_AI_TAG_SUGGESTIONS,
  validateAnalysisTagSuggestions,
  type UserTagForAnalysis,
} from "./analyze-tag-suggestions";

const userTags: UserTagForAnalysis[] = [
  { id: "1", name: "AWS", normalizedName: "aws" },
  { id: "2", name: "Backend", normalizedName: "backend" },
  { id: "3", name: "DevOps", normalizedName: "devops" },
];

describe("validateAnalysisTagSuggestions", () => {
  it("resolves existing tags with normalized matching", () => {
    const result = validateAnalysisTagSuggestions(
      { existing: ["aws", "backend"], suggested: [] },
      userTags,
    );
    assert.deepEqual(result.existing.map((tag) => tag.name).sort(), [
      "AWS",
      "Backend",
    ]);
    assert.deepEqual(result.new, []);
  });

  it("discards unknown existing tag names", () => {
    const result = validateAnalysisTagSuggestions(
      { existing: ["SecretTag", "AWS"], suggested: [] },
      userTags,
    );
    assert.deepEqual(result.existing.map((tag) => tag.name), ["AWS"]);
  });

  it("validates new tag suggestions and excludes duplicates of owned tags", () => {
    const result = validateAnalysisTagSuggestions(
      { existing: [], suggested: ["PostgreSQL", "aws", "DevOps"] },
      userTags,
    );
    assert.deepEqual(result.new, ["PostgreSQL"]);
    assert.deepEqual(result.existing.map((tag) => tag.name).sort(), [
      "AWS",
      "DevOps",
    ]);
  });

  it("excludes already selected tags from suggestions", () => {
    const result = validateAnalysisTagSuggestions(
      { existing: ["AWS", "Backend"], suggested: ["PostgreSQL"] },
      userTags,
      ["1"],
    );
    assert.deepEqual(result.existing.map((tag) => tag.name), ["Backend"]);
    assert.deepEqual(result.new, ["PostgreSQL"]);
  });

  it("rejects invalid new tag names", () => {
    const result = validateAnalysisTagSuggestions(
      { existing: [], suggested: ["", "x".repeat(49)] },
      userTags,
    );
    assert.equal(result.existing.length, 0);
    assert.equal(result.new.length, 0);
  });

  it("caps total suggestions at five", () => {
    const result = validateAnalysisTagSuggestions(
      {
        existing: ["AWS", "Backend", "DevOps"],
        suggested: ["Alpha", "Beta", "Gamma"],
      },
      userTags,
    );
    assert.equal(
      result.existing.length + result.new.length,
      MAX_AI_TAG_SUGGESTIONS,
    );
  });

  it("treats cross-user secret name in existing as discard, not lookup", () => {
    const userBTags: UserTagForAnalysis[] = [
      { id: "b1", name: "Personal", normalizedName: "personal" },
    ];
    const result = validateAnalysisTagSuggestions(
      { existing: ["SecretTag"], suggested: ["SecretTag"] },
      userBTags,
    );
    assert.equal(result.existing.length, 0);
    assert.deepEqual(result.new, ["SecretTag"]);
  });
});
