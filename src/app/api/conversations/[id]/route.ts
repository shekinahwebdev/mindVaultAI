import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  deleteConversationForUser,
  getConversationForUser,
  renameConversationForUser,
} from "@/lib/chat/chat-repository";
import { parseRenameConversationBody } from "@/lib/chat/chat-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const conversation = await getConversationForUser(auth.session.userId, id);

  if (!conversation) {
    return NextResponse.json({ ok: false, message: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, conversation });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = parseRenameConversationBody(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 400 });
  }

  const updated = await renameConversationForUser(
    auth.session.userId,
    id,
    parsed.data.title,
  );

  if (!updated) {
    return NextResponse.json({ ok: false, message: "Conversation not found." }, { status: 404 });
  }

  const conversation = await getConversationForUser(auth.session.userId, id);
  return NextResponse.json({ ok: true, conversation });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const deleted = await deleteConversationForUser(auth.session.userId, id);

  if (!deleted) {
    return NextResponse.json({ ok: false, message: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
