import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ChatAttachmentScope } from "@/lib/chat/chat-attachments";

import { buildAttachmentEmptyAnswer } from "./retrieval-disclaimer";

function scope(partial: Partial<ChatAttachmentScope> & Pick<ChatAttachmentScope, "hasAttachments">): ChatAttachmentScope {
  return {
    readyDocumentIds: [],
    droppedDocumentIds: [],
    notReadyDocumentIds: [],
    attachedDocuments: [],
    includeNotes: false,
    ...partial,
  };
}

describe("buildAttachmentEmptyAnswer", () => {
  it("explains when attachments are still indexing", () => {
    const text = buildAttachmentEmptyAnswer(
      scope({
        hasAttachments: true,
        notReadyDocumentIds: ["d1"],
      }),
    );
    assert.match(text, /still indexing/i);
  });

  it("explains when attached documents were removed", () => {
    const text = buildAttachmentEmptyAnswer(
      scope({
        hasAttachments: true,
        droppedDocumentIds: ["d1"],
      }),
    );
    assert.match(text, /no longer available/i);
  });

  it("does not imply a vault-wide search when scoped retrieval is empty", () => {
    const text = buildAttachmentEmptyAnswer(
      scope({
        hasAttachments: true,
        readyDocumentIds: ["d1"],
      }),
    );
    assert.match(text, /attached PDFs/i);
  });
});
