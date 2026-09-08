import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  parseSignUpBody,
  REGISTER_DUPLICATE_EMAIL,
  REGISTER_SERVER_ERROR,
} from "@/lib/auth-validation";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseSignUpBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          ok: false,
          errors: { email: REGISTER_DUPLICATE_EMAIL },
        },
        { status: 409 },
      );
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { ok: false, message: REGISTER_SERVER_ERROR },
      { status: 500 },
    );
  }
}
