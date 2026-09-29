import type { ChatTurn } from "@/components/vault/chat/chat-types";
import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import { CHAT_PROVIDER_FAILURE } from "@/lib/rag/chat-client";

import type { SerializedChatMessage } from "./serialize";

function inferAssistantOutcome(assistant: SerializedChatMessage): ChatAnswerOutcome {
  if (assistant.outcome) {
    return assistant.outcome;
  }
  if (assistant.sources && assistant.sources.length > 0) {
    return "answered";
  }
  return "no_relevant_knowledge";
}

export function messagesToTurns(messages: SerializedChatMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let index = 0;

  while (index < messages.length) {
    const message = messages[index];
    if (message.role !== "USER") {
      index += 1;
      continue;
    }

    const assistant =
      messages[index + 1]?.role === "ASSISTANT" ? messages[index + 1] : null;

    if (assistant) {
      turns.push({
        id: message.id,
        question: message.content,
        mode: "ask",
        status: "done",
        createdAt: new Date(message.createdAt).getTime(),
        answer: assistant.content,
        answerOutcome: inferAssistantOutcome(assistant),
        sources: assistant.sources,
      });
      index += 2;
      continue;
    }

    turns.push({
      id: message.id,
      question: message.content,
      mode: "ask",
      status: "error",
      createdAt: new Date(message.createdAt).getTime(),
      error: CHAT_PROVIDER_FAILURE,
    });
    index += 1;
  }

  return turns;
}
