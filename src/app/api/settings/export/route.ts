import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";
import { exportUserVault } from "@/lib/settings/settings-queries";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  try {
    const payload = await exportUserVault(auth.session.userId);
    const filename = `mindvault-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export vault failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
