import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const CHAT_DIR = join(import.meta.dirname);
const REPO_ROOT = join(CHAT_DIR, "../../..");

const MOCK_STRINGS = [
  "What have I saved about authentication?",
  "Summarize my AWS notes",
  "Explain React hooks",
  "Plan my study roadmap",
  "Key takeaways from this article",
  "Compare JWT vs session auth",
  "Show my AWS IAM notes",
  "List security-related saves",
  "Draft a learning checklist",
  "Programming",
  "DEMO_CHAT_HISTORY",
  "CHAT_QUICK_PROMPTS",
  "CHAT_SUGGESTED_FOLLOWUPS",
  "chat-history-demo",
];

const CHAT_UI_FILES = [
  "ChatView.tsx",
  "ChatHistorySidebar.tsx",
  "ChatContextPanel.tsx",
  "ChatComposer.tsx",
];

function readChatFile(name: string) {
  return readFileSync(join(CHAT_DIR, name), "utf8");
}

describe("chat UI truthfulness", () => {
  it("does not import chat-history-demo", () => {
    for (const file of CHAT_UI_FILES) {
      const source = readChatFile(file);
      assert.equal(
        source.includes("chat-history-demo"),
        false,
        `${file} must not import chat-history-demo`,
      );
    }
  });

  it("does not contain hardcoded demo chat strings in chat UI sources", () => {
    for (const file of CHAT_UI_FILES) {
      const source = readChatFile(file);
      for (const mock of MOCK_STRINGS) {
        assert.equal(
          source.includes(mock),
          false,
          `${file} must not contain mock string: ${mock}`,
        );
      }
    }
  });

  it("ChatHistorySidebar shows persisted empty state copy", () => {
    const source = readChatFile("ChatHistorySidebar.tsx");
    assert.match(source, /No conversations yet/);
    assert.equal(source.includes("Session chats"), false);
  });

  it("ChatComposer gates Agent and disables attachment", () => {
    const source = readChatFile("ChatComposer.tsx");
    assert.match(source, /MindVault Agent \(Coming soon\)/);
    assert.match(source, /Document upload coming soon/);
    assert.match(source, /aria-disabled="true"/);
  });

  it("ChatContextPanel is sources-only", () => {
    const source = readChatFile("ChatContextPanel.tsx");
    assert.match(source, /Sources/);
    assert.equal(source.includes("Related"), false);
    assert.equal(source.includes("Actions"), false);
  });

  it("ChatView toggles context panel", () => {
    const source = readChatFile("ChatView.tsx");
    assert.match(source, /contextPanelOpen/);
    assert.match(source, /Hide context panel/);
    assert.match(source, /Show context panel/);
  });

  it("chat-history-demo module was removed", () => {
    let threw = false;
    try {
      readFileSync(join(REPO_ROOT, "src/lib/vault/chat-history-demo.ts"), "utf8");
    } catch {
      threw = true;
    }
    assert.equal(threw, true, "chat-history-demo.ts should be deleted");
  });
});
