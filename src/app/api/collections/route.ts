import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  createCollectionForUser,
  listCollectionsForUser,
} from "@/lib/collections/collection-repository";
import {
  parseCollectionDescription,
  parseCollectionName,
} from "@/lib/collections/collection-validation";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const collections = await listCollectionsForUser(auth.session.userId);
  return NextResponse.json({ ok: true, collections });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const parsedName = parseCollectionName(record.name);
  if (!parsedName.ok) {
    return NextResponse.json({ ok: false, errors: parsedName.errors }, { status: 400 });
  }

  const description = parseCollectionDescription(record.description);
  const result = await createCollectionForUser(
    auth.session.userId,
    parsedName.name,
    description,
  );

  if ("ok" in result && result.ok === false) {
    return NextResponse.json(
      { ok: false, errors: { name: "You already have a collection with this name." } },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, collection: result });
}
