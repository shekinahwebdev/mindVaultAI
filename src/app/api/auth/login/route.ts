import { NextResponse } from "next/server";

import { verifyPasswordWithTimingGuard } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import {
  LOGIN_INVALID_CREDENTIALS,
  LOGIN_SERVER_ERROR,
  parseSignInBody,
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

  const parsed = parseSignInBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    const passwordMatches = await verifyPasswordWithTimingGuard(
      password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { ok: false, message: LOGIN_INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { ok: false, message: LOGIN_SERVER_ERROR },
      { status: 500 },
    );
  }
}
