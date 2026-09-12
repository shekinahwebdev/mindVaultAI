import { readAuthJson } from "@/lib/auth/client";
import type { NoteType } from "@/generated/prisma/enums";

import type { AgentTraceStep } from "./types";

export type AgentAction = {
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type AgentApiResponse =
  | { ok: true; type: "answer"; message: string; trace: AgentTraceStep[] }
  | { ok: true; type: "pending_action"; message: string; action: AgentAction; trace: AgentTraceStep[] }
  | { ok: false; message?: string };

export const AGENT_LOAD_ERROR =
  "MindVault's agent couldn't complete that right now. Your vault is unaffected.";

export async function askAgentRequest(message: string, signal?: AbortSignal) {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
  });

  const data = await readAuthJson<AgentApiResponse>(response);
  return { response, data };
}
