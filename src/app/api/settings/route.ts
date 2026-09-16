import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { getSettingsBundle } from "@/lib/settings/settings-queries";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  try {
    const bundle = await getSettingsBundle(auth.session.userId);
    return NextResponse.json({
      ok: true,
      account: bundle.account,
      preferences: bundle.preferences,
      storage: bundle.storage,
    });
  } catch (error) {
    console.error("Get settings failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
