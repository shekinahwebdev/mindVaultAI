import type { AgentAction } from "@/lib/agent/agent-client";
import type { AgentTraceStep } from "@/lib/agent/types";
import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/chat-client";

export type ChatMode = "ask" | "agent";

export type ActionState = "pending" | "saving" | "saved" | "cancelled" | "save_error";

export type ChatTurn = {
  id: string;
  question: string;
  mode: ChatMode;
  status: "loading" | "done" | "error" | "pending_action";
  createdAt: number;
  answer?: string;
  answerOutcome?: ChatAnswerOutcome;
  sources?: AskVaultSource[];
  trace?: AgentTraceStep[];
  action?: AgentAction;
  actionState?: ActionState;
  actionError?: string;
  error?: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  updatedAt: number;
  turns: ChatTurn[];
};
