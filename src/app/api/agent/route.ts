import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { runAgent } from "@/lib/agent/run-agent";

export const AGENT_INVALID_MESSAGE = "Ask something a bit more specific.";
export const AGENT_UNAVAILABLE_MESSAGE =
  "MindVault's agent couldn't complete that right now. Your vault is unaffected.";
export const AGENT_TOO_MANY_STEPS_MESSAGE =
  "That request needed more steps than MindVault allows in one go. Try asking something narrower.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.message !== "string") {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const startedAt = Date.now();

  // userId always comes from the server session — runAgent has no
  // parameter that would let a client act on another user's behalf.
  const result = await runAgent(session.userId, body.message);

  console.log("[agent:run]", {
    operation: "agent_run",
    provider: "gemini",
    ok: result.type !== "error",
    resultType: result.type,
    totalLatencyMs: Date.now() - startedAt,
    ...(result.type !== "error" ? { toolCalls: result.trace.length, toolNames: result.trace.map((step) => step.tool) } : { reason: result.reason }),
  });

  if (result.type === "error") {
    if (result.reason === "invalid_message") {
      return NextResponse.json({ ok: false, message: AGENT_INVALID_MESSAGE }, { status: 400 });
    }
    if (result.reason === "too_many_steps") {
      return NextResponse.json({ ok: false, message: AGENT_TOO_MANY_STEPS_MESSAGE }, { status: 502 });
    }
    return NextResponse.json({ ok: false, message: AGENT_UNAVAILABLE_MESSAGE }, { status: 502 });
  }

  if (result.type === "pending_action") {
    return NextResponse.json({
      ok: true,
      type: "pending_action",
      message: result.message,
      action: result.action,
      trace: result.trace,
    });
  }

  return NextResponse.json({
    ok: true,
    type: "answer",
    message: result.message,
    trace: result.trace,
  });
}
