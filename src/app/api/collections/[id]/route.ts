import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  deleteCollectionForUser,
  getCollectionForUser,
  updateCollectionForUser,
} from "@/lib/collections/collection-repository";
import { serializeCollection } from "@/lib/collections/collection-serialize";
import {
  parseCollectionDescription,
  parseCollectionName,
} from "@/lib/collections/collection-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const row = await getCollectionForUser(auth.session.userId, id);
  if (!row) {
    return NextResponse.json({ ok: false, message: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    collection: serializeCollection(row, row._count.items),
  });
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
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const patch: { name?: string; description?: string | null } = {};

  if (record.name !== undefined) {
    const parsedName = parseCollectionName(record.name);
    if (!parsedName.ok) {
      return NextResponse.json({ ok: false, errors: parsedName.errors }, { status: 400 });
    }
    patch.name = parsedName.name;
  }

  if (record.description !== undefined) {
    patch.description = parseCollectionDescription(record.description);
  }

  const result = await updateCollectionForUser(auth.session.userId, id, patch);
  if (result === null) {
    return NextResponse.json({ ok: false, message: "Collection not found." }, { status: 404 });
  }
  if ("ok" in result && result.ok === false) {
    return NextResponse.json(
      { ok: false, errors: { name: "You already have a collection with this name." } },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, collection: result });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const deleted = await deleteCollectionForUser(auth.session.userId, id);
  if (!deleted) {
    return NextResponse.json({ ok: false, message: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
