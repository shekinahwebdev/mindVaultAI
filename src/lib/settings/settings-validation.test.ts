import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeProfileBio, PROFILE_BIO_MAX_LENGTH } from "./profile-bio";
import { parseUpdateAccountBody } from "./settings-validation";

describe("normalizeProfileBio", () => {
  it("trims outer whitespace and preserves inner content", () => {
    assert.equal(normalizeProfileBio("  hello\nworld  "), "hello\nworld");
  });

  it("returns null for whitespace-only input", () => {
    assert.equal(normalizeProfileBio("   \n  "), null);
  });
});

describe("parseUpdateAccountBody bio", () => {
  it("accepts a normal bio with name", () => {
    const result = parseUpdateAccountBody({
      name: "Patricia Kanneh",
      bio: "AI engineer in training. Building MindVault.",
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.bio, "AI engineer in training. Building MindVault.");
  });

  it("stores null for empty bio", () => {
    const result = parseUpdateAccountBody({ name: "Patricia Kanneh", bio: "   " });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.bio, null);
  });

  it("accepts max-length bio", () => {
    const bio = "a".repeat(PROFILE_BIO_MAX_LENGTH);
    const result = parseUpdateAccountBody({ name: "Patricia Kanneh", bio });
    assert.equal(result.success, true);
  });

  it("rejects over-limit bio", () => {
    const bio = "a".repeat(PROFILE_BIO_MAX_LENGTH + 1);
    const result = parseUpdateAccountBody({ name: "Patricia Kanneh", bio });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.errors.bio);
  });

  it("rejects non-string bio", () => {
    const result = parseUpdateAccountBody({ name: "Patricia Kanneh", bio: 42 });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.errors.bio, "Bio must be text.");
  });

  it("allows HTML-looking text as plain string", () => {
    const bio = "<script>alert('x')</script>";
    const result = parseUpdateAccountBody({ name: "Patricia Kanneh", bio });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.bio, bio);
  });
});
