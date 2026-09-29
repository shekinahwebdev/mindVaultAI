import { readAuthJson } from "@/lib/auth/client";

import type { SerializedConversationDetail, SerializedConversationSummary } from "./serialize";

export type ListConversationsResponse =
  | { ok: true; conversations: SerializedConversationSummary[] }
  | { ok: false; message?: string };

export type GetConversationResponse =
  | { ok: true; conversation: SerializedConversationDetail }
  | { ok: false; message?: string };

export type DeleteConversationResponse = { ok: true } | { ok: false; message?: string };

export type RenameConversationResponse =
  | { ok: true; conversation: SerializedConversationDetail }
  | { ok: false; message?: string; errors?: { title?: string } };

export const CONVERSATIONS_LOAD_ERROR =
  "Could not load your conversations. Please try again.";

export async function fetchConversations() {
  const response = await fetch("/api/conversations");
  const data = await readAuthJson<ListConversationsResponse>(response);
  return { response, data };
}

export async function fetchConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`);
  const data = await readAuthJson<GetConversationResponse>(response);
  return { response, data };
}

export async function deleteConversationRequest(id: string) {
  const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  const data = await readAuthJson<DeleteConversationResponse>(response);
  return { response, data };
}

export async function renameConversationRequest(id: string, title: string) {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await readAuthJson<RenameConversationResponse>(response);
  return { response, data };
}
