import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DocumentProcessingJobStatus, DocumentStatus } from "@/generated/prisma/enums";

import { deriveProcessingDisplayStatus } from "./processing-status";

describe("deriveProcessingDisplayStatus", () => {
  it("never shows ready unless document is READY", () => {
    const status = deriveProcessingDisplayStatus({
      documentStatus: DocumentStatus.QUEUED,
      job: {
        jobId: "j1",
        status: DocumentProcessingJobStatus.SUCCEEDED,
        attemptCount: 1,
        maxAttempts: 5,
        availableAt: null,
        lastError: null,
      },
    });
    assert.equal(status, "queued");
  });

  it("shows processing when job is running", () => {
    const status = deriveProcessingDisplayStatus({
      documentStatus: DocumentStatus.PROCESSING,
      job: {
        jobId: "j1",
        status: DocumentProcessingJobStatus.RUNNING,
        attemptCount: 1,
        maxAttempts: 5,
        availableAt: null,
        lastError: null,
      },
    });
    assert.equal(status, "processing");
  });
});
