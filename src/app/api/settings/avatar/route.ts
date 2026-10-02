import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { setSession } from "@/lib/auth/session";
import { parseUpdateAvatarBody } from "@/lib/profile/avatar-validation";
import { updateUserAvatar } from "@/lib/profile/user-profile.server";
import { serializeUserAvatar } from "@/lib/profile/user-avatar-types";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";

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

  const parsed = parseUpdateAvatarBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.message },
      { status: 400 },
    );
  }

  try {
    const account = await updateUserAvatar(auth.session.userId, parsed.data);
    const avatar = serializeUserAvatar(account);

    await setSession({
      userId: account.id,
      email: account.email,
      name: account.name,
      ...avatar,
    });

    return NextResponse.json({
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt.toISOString(),
        ...avatar,
      },
    });
  } catch (error) {
    console.error("Update avatar failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
