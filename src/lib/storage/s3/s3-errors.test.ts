import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyS3ClientError, userMessageForS3ClientError } from "./s3-errors";

describe("classifyS3ClientError", () => {
  it("detects missing credentials", () => {
    const err = new Error("Could not load credentials from any providers");
    err.name = "CredentialsProviderError";
    assert.equal(classifyS3ClientError(err), "credentials_missing");
  });

  it("returns safe user messages without internal details", () => {
    const message = userMessageForS3ClientError("credentials_missing");
    assert.doesNotMatch(message, /arn:aws/i);
    assert.doesNotMatch(message, /mindvault-documents/i);
  });
});
