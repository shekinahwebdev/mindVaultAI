import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  addCollectionItemForUser,
  getCollectionForUser,
  removeCollectionItemForUser,
} from "@/lib/collections/collection-repository";
import { parseCollectionItemBody } from "@/lib/collections/collection-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseCollectionItemBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });
  }

  const result = await addCollectionItemForUser(
    auth.session.userId,
    id,
    parsed.kind,
    parsed.itemId,
  );

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ ok: false, message: "Collection not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: false, message: "Item not found in your vault." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsed = parseCollectionItemBody({
    kind: searchParams.get("kind"),
    itemId: searchParams.get("itemId"),
  });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });
  }

  const removed = await removeCollectionItemForUser(
    auth.session.userId,
    id,
    parsed.kind,
    parsed.itemId,
  );
  if (!removed) {
    const collection = await getCollectionForUser(auth.session.userId, id);
    if (!collection) {
      return NextResponse.json({ ok: false, message: "Collection not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: false, message: "Item was not in this collection." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
