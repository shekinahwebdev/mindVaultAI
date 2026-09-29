import { readAuthJson } from "@/lib/auth/client";

import {
  CHAT_PROVIDER_FAILURE_MESSAGE,
  CHAT_SERVER_FAILURE_MESSAGE,
  type ChatAnswerOutcome,
} from "@/lib/chat/chat-outcomes";

import type { AskVaultSource } from "./types";

export type { AskVaultSource };

export type ChatApiResponse =
  | {
      ok: true;
      outcome: ChatAnswerOutcome;
      conversationId: string;
      answer: string;
      sources: AskVaultSource[];
      userMessageId: string;
      assistantMessageId: string;
    }
  | {
      ok: false;
      error?: string;
      message?: string;
      conversationId?: string;
      userMessageId?: string;
    };

export const CHAT_PROVIDER_FAILURE = CHAT_PROVIDER_FAILURE_MESSAGE;
export const CHAT_SERVER_FAILURE = CHAT_SERVER_FAILURE_MESSAGE;

/** @deprecated Use CHAT_PROVIDER_FAILURE */
export const CHAT_LOAD_ERROR = CHAT_PROVIDER_FAILURE_MESSAGE;

export async function askVaultRequest(
  question: string,
  options?: { conversationId?: string; signal?: AbortSignal },
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      ...(options?.conversationId ? { conversationId: options.conversationId } : {}),
    }),
    signal: options?.signal,
  });

  const data = await readAuthJson<ChatApiResponse>(response);
  return { response, data };
}
