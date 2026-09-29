import { NextResponse } from "next/server";

import type { SessionData } from "@/lib/auth/session";
import { UNAUTHORIZED_MESSAGE } from "@/lib/auth/guards";

import {
  TAG_DUPLICATE_MESSAGE,
  TAG_NOT_FOUND_MESSAGE,
  TAG_SERVER_ERROR_MESSAGE,
} from "./tag-errors";
import { parseListTagsQuery } from "./tag-list-query";
import { parseCreateTagBody, parseRenameTagBody } from "./tag-validation";
import {
  createTagForUser,
  deleteTagForUser,
  findTagForUser,
  getTagStatsForUser,
  getTopTagsForUser,
  listTagsForUser,
  renameTagForUser,
} from "./tag-repository";

export type TagApiJson =
  | Record<string, unknown>
  | { ok: false; message: string; errors?: Record<string, string> };

function unauthorizedJson() {
  return NextResponse.json(
    { ok: false, message: UNAUTHORIZED_MESSAGE },
    { status: 401 },
  );
}

function mapCreateOrRenameFailure(result: {
  ok: false;
  code: string;
  errors?: { name?: string };
  message?: string;
}) {
  if (result.code === "invalid_input") {
    return NextResponse.json(
      { ok: false, errors: result.errors },
      { status: 400 },
    );
  }

  if (result.code === "duplicate_tag") {
    return NextResponse.json(
      {
        ok: false,
        message: TAG_DUPLICATE_MESSAGE,
        errors: result.errors ?? { name: TAG_DUPLICATE_MESSAGE },
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { ok: false, message: result.message ?? TAG_SERVER_ERROR_MESSAGE },
    { status: 500 },
  );
}

export async function handleListTags(
  session: SessionData | null,
  url: URL,
): Promise<NextResponse<TagApiJson>> {
  if (!session) {
    return unauthorizedJson();
  }

  const parsedQuery = parseListTagsQuery(url.searchParams);
  if (!parsedQuery.success) {
    return NextResponse.json(
      { ok: false, message: parsedQuery.message },
      { status: 400 },
    );
  }

  try {
    const [tags, stats, insights] = await Promise.all([
      listTagsForUser(session.userId, parsedQuery.data),
      getTagStatsForUser(session.userId),
      getTopTagsForUser(session.userId, 5),
    ]);

    return NextResponse.json({
      ok: true,
      tags,
      stats,
      insights,
    });
  } catch (error) {
    console.error("List tags failed:", error);
    return NextResponse.json(
      { ok: false, message: TAG_SERVER_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}

export async function handleCreateTag(
  session: SessionData | null,
  body: unknown,
): Promise<NextResponse<TagApiJson>> {
  if (!session) {
    return unauthorizedJson();
  }

  const parsed = parseCreateTagBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const result = await createTagForUser(session.userId, parsed.data.name);
  if (!result.ok) {
    return mapCreateOrRenameFailure(result);
  }

  return NextResponse.json({ ok: true, tag: result.tag }, { status: 201 });
}

export async function handleGetTag(
  session: SessionData | null,
  tagId: string,
): Promise<NextResponse<TagApiJson>> {
  if (!session) {
    return unauthorizedJson();
  }

  try {
    const tag = await findTagForUser(session.userId, tagId);
    if (!tag) {
      return NextResponse.json(
        { ok: false, message: TAG_NOT_FOUND_MESSAGE },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, tag });
  } catch (error) {
    console.error("Get tag failed:", error);
    return NextResponse.json(
      { ok: false, message: TAG_SERVER_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}

export async function handleRenameTag(
  session: SessionData | null,
  tagId: string,
  body: unknown,
): Promise<NextResponse<TagApiJson>> {
  if (!session) {
    return unauthorizedJson();
  }

  const parsed = parseRenameTagBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const result = await renameTagForUser(
    session.userId,
    tagId,
    parsed.data.name,
  );

  if (!result.ok) {
    if (result.code === "tag_not_found") {
      return NextResponse.json(
        { ok: false, message: TAG_NOT_FOUND_MESSAGE },
        { status: 404 },
      );
    }
    return mapCreateOrRenameFailure(result);
  }

  return NextResponse.json({ ok: true, tag: result.tag });
}

export async function handleDeleteTag(
  session: SessionData | null,
  tagId: string,
): Promise<NextResponse<TagApiJson>> {
  if (!session) {
    return unauthorizedJson();
  }

  const result = await deleteTagForUser(session.userId, tagId);
  if (!result.ok) {
    if (result.code === "tag_not_found") {
      return NextResponse.json(
        { ok: false, message: TAG_NOT_FOUND_MESSAGE },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, message: result.message ?? TAG_SERVER_ERROR_MESSAGE },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
