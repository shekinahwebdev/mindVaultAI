import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { hashPassword, verifyPasswordWithTimingGuard } from "@/lib/auth/password";
import { LOGIN_INVALID_CREDENTIALS } from "@/lib/auth-validation";
import { prisma } from "@/lib/db";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";
import { parseChangePasswordBody } from "@/lib/settings/settings-validation";

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

  const parsed = parseChangePasswordBody(body);
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

    const passwordHash = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id: auth.session.userId },
      data: { passwordHash },
    });

    // Sessions are stateless signed cookies with no server-side session store.
    // The current session remains valid after a password change because the
    // cookie only carries userId/email/name — not the password hash. This
    // matches common SPA behavior and avoids signing the user out mid-flow.
    // Other devices/tabs with an old cookie also remain valid until expiry;
    // there is no per-device session tracking to revoke them individually.

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Change password failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
