import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { verifyPasswordWithTimingGuard } from "@/lib/auth/password";
import { clearSession, setSession } from "@/lib/auth/session";
import { LOGIN_INVALID_CREDENTIALS } from "@/lib/auth-validation";
import { prisma } from "@/lib/db";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";
import {
  deleteUserAccount,
  updateAccountName,
} from "@/lib/settings/settings-queries";
import {
  parseDeleteAccountBody,
  parseUpdateAccountBody,
} from "@/lib/settings/settings-validation";

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseUpdateAccountBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  try {
    const account = await updateAccountName(
      auth.session.userId,
      parsed.data.name,
    );

    await setSession({
      userId: account.id,
      email: account.email,
      name: account.name,
    });

    return NextResponse.json({
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update account failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseDeleteAccountBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.userId },
      select: { passwordHash: true },
    });

    const passwordMatches = await verifyPasswordWithTimingGuard(
      parsed.data.currentPassword,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { ok: false, errors: { currentPassword: LOGIN_INVALID_CREDENTIALS } },
        { status: 401 },
      );
    }

    await deleteUserAccount(auth.session.userId);
    await clearSession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete account failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
