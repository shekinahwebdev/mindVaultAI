import { CONVERSATION_TITLE_MAX_LENGTH } from "./chat-title";

export type RenameConversationInput = {
  title: string;
};

export function parseRenameConversationBody(
  body: unknown,
):
  | { success: true; data: RenameConversationInput }
  | { success: false; errors: { title?: string } } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { success: false, errors: { title: "Invalid request." } };
  }

  const titleRaw = (body as { title?: unknown }).title;
  if (typeof titleRaw !== "string") {
    return { success: false, errors: { title: "Title is required." } };
  }

  const title = titleRaw.trim();
  if (!title) {
    return { success: false, errors: { title: "Title is required." } };
  }

  if (title.length > CONVERSATION_TITLE_MAX_LENGTH) {
    return {
      success: false,
      errors: {
        title: `Title must be at most ${CONVERSATION_TITLE_MAX_LENGTH} characters.`,
      },
    };
  }

  return { success: true, data: { title } };
}

export function parseChatPostBody(body: unknown):
  | { success: true; question: string; conversationId?: string }
  | { success: false } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { success: false };
  }

  const record = body as { question?: unknown; conversationId?: unknown };
  if (typeof record.question !== "string") {
    return { success: false };
  }

  let conversationId: string | undefined;
  if (record.conversationId !== undefined && record.conversationId !== null) {
    if (typeof record.conversationId !== "string" || !record.conversationId.trim()) {
      return { success: false };
    }
    conversationId = record.conversationId.trim();
  }

  return { success: true, question: record.question, conversationId };
}
