import { readAuthJson } from "@/lib/auth/client";

import type { AskVaultSource } from "./types";

export type { AskVaultSource };

export type ChatApiResponse =
  | { ok: true; answer: string; sources: AskVaultSource[] }
  | { ok: false; message?: string };

export const CHAT_LOAD_ERROR =
  "MindVault couldn't answer from your vault right now. Your saved knowledge is still safe.";

export async function askVaultRequest(question: string, signal?: AbortSignal) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  });

  const data = await readAuthJson<ChatApiResponse>(response);
  return { response, data };
}
