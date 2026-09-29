import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  CHAT_PROVIDER_FAILURE_MESSAGE,
  CHAT_SERVER_FAILURE_MESSAGE,
} from "@/lib/chat/chat-outcomes";
import { parseChatPostBody } from "@/lib/chat/chat-validation";
import { processChatMessage } from "@/lib/chat/process-chat-message";
import { askVault } from "@/lib/rag/ask-vault";

export const CHAT_INVALID_QUESTION = "Ask a real question about your vault.";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  const { getUserPreferenceFlags } = await import("@/lib/settings/preferences-server");
  const flags = await getUserPreferenceFlags(session.userId);
  if (!flags.ragEnabled) {
    return NextResponse.json(
      { ok: false, error: "rag_disabled", message: "Ask MindVault is disabled in Settings." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = parseChatPostBody(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const startedAt = Date.now();

  let result;
  try {
    result = await processChatMessage({
      userId: session.userId,
      question: parsed.question,
      conversationId: parsed.conversationId,
      askVault: (input) => askVault(input),
    });
  } catch {
    console.log("[chat:post]", {
      operation: "chat_message",
      outcome: "server_failure",
      userId: session.userId,
      latencyMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "server_failure",
        message: CHAT_SERVER_FAILURE_MESSAGE,
      },
      { status: 500 },
    );
  }

  console.log("[chat:post]", {
    operation: "chat_message",
    ok: result.ok,
    outcome: result.ok ? result.outcome : result.reason,
    conversationId: result.ok ? result.conversationId : result.conversationId,
    userId: session.userId,
    sourceCount: result.ok ? result.sources.length : undefined,
    latencyMs: Date.now() - startedAt,
  });

  if (!result.ok) {
    if (result.reason === "invalid_question") {
      return NextResponse.json(
        { ok: false, error: "invalid_question", message: CHAT_INVALID_QUESTION },
        { status: 400 },
      );
    }

    if (result.reason === "conversation_not_found") {
      return NextResponse.json(
        { ok: false, error: "conversation_not_found", message: result.message },
        { status: 404 },
      );
    }

    if (result.reason === "server_failure") {
      return NextResponse.json(
        { ok: false, error: "server_failure", message: CHAT_SERVER_FAILURE_MESSAGE },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "provider_failure",
        message: result.message || CHAT_PROVIDER_FAILURE_MESSAGE,
        conversationId: result.conversationId,
        userMessageId: result.userMessageId,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    outcome: result.outcome,
    conversationId: result.conversationId,
    answer: result.answer,
    sources: result.sources,
    userMessageId: result.userMessageId,
    assistantMessageId: result.assistantMessageId,
  });
}
