import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  getConversationForUser,
  updateConversationAttachmentsForUser,
} from "@/lib/chat/chat-repository";
import { resolveChatAttachmentScope } from "@/lib/chat/chat-attachments";
import { parseConversationAttachmentsBody } from "@/lib/chat/chat-validation";

type RouteContext = { params: Promise<{ id: string }> };

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

  const parsed = parseConversationAttachmentsBody(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const scope = await resolveChatAttachmentScope(
    auth.session.userId,
    parsed.data.attachedDocumentIds,
    parsed.data.attachmentIncludeNotes,
  );

  const ownedIds = parsed.data.attachedDocumentIds.filter(
    (docId) => !scope.droppedDocumentIds.includes(docId),
  );

  const updated = await updateConversationAttachmentsForUser(
    auth.session.userId,
    id,
    ownedIds,
    scope.hasAttachments ? scope.includeNotes : false,
  );

  if (!updated) {
    return NextResponse.json({ ok: false, message: "Conversation not found." }, { status: 404 });
  }

  const conversation = await getConversationForUser(auth.session.userId, id);
  if (!conversation) {
    return NextResponse.json({ ok: false, message: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, conversation });
}
