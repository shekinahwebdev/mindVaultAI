import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import {
  CATEGORY_DUPLICATE_NAME,
  CATEGORY_NOT_FOUND,
  CATEGORY_SERVER_ERROR,
  parseUpdateCategoryBody,
} from "@/lib/category-validation";
import { findDuplicateCategoryName } from "@/lib/categories/category-duplicate";
import {
  categorySelect,
  serializeCategory,
} from "@/lib/categories/serialize";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function categoryNotFoundResponse() {
  return NextResponse.json(
    { ok: false, message: CATEGORY_NOT_FOUND },
    { status: 404 },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseUpdateCategoryBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const existing = await prisma.category.findFirst({
    where: {
      id,
      userId: session.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return categoryNotFoundResponse();
  }

  const duplicate = await findDuplicateCategoryName(
    session.userId,
    parsed.data.name,
    existing.id,
  );

  if (duplicate) {
    return NextResponse.json(
      { ok: false, errors: { name: CATEGORY_DUPLICATE_NAME } },
      { status: 409 },
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id: existing.id },
      data: { name: parsed.data.name },
      select: categorySelect,
    });

    return NextResponse.json({ ok: true, category: serializeCategory(category) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, errors: { name: CATEGORY_DUPLICATE_NAME } },
        { status: 409 },
      );
    }

    console.error("Update category failed:", error);
    return NextResponse.json(
      { ok: false, message: CATEGORY_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  try {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return categoryNotFoundResponse();
    }

    const affectedNotes = await prisma.note.count({
      where: {
        userId: session.userId,
        categoryId: existing.id,
      },
    });

    await prisma.category.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      ok: true,
      affectedNotes,
    });
  } catch (error) {
    console.error("Delete category failed:", error);
    return NextResponse.json(
      { ok: false, message: CATEGORY_SERVER_ERROR },
      { status: 500 },
    );
  }
}
