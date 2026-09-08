import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import {
  CATEGORY_DUPLICATE_NAME,
  CATEGORY_SERVER_ERROR,
  parseCreateCategoryBody,
} from "@/lib/category-validation";
import { findDuplicateCategoryName } from "@/lib/categories/category-duplicate";
import {
  categorySelect,
  serializeCategory,
} from "@/lib/categories/serialize";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  try {
    const categories = await prisma.category.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
      select: categorySelect,
    });

    return NextResponse.json({
      ok: true,
      categories: categories.map(serializeCategory),
    });
  } catch (error) {
    console.error("List categories failed:", error);
    return NextResponse.json(
      { ok: false, message: CATEGORY_SERVER_ERROR },
      { status: 500 },
    );
  }
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
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseCreateCategoryBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const duplicate = await findDuplicateCategoryName(
    session.userId,
    parsed.data.name,
  );

  if (duplicate) {
    return NextResponse.json(
      { ok: false, errors: { name: CATEGORY_DUPLICATE_NAME } },
      { status: 409 },
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        userId: session.userId,
      },
      select: categorySelect,
    });

    return NextResponse.json(
      { ok: true, category: serializeCategory(category) },
      { status: 201 },
    );
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

    console.error("Create category failed:", error);
    return NextResponse.json(
      { ok: false, message: CATEGORY_SERVER_ERROR },
      { status: 500 },
    );
  }
}
