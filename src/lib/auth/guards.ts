import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

import { getSession, type SessionData } from "./session";

export const UNAUTHORIZED_MESSAGE = "Authentication required.";

export async function requireApiSession(): Promise<
  { session: SessionData } | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: UNAUTHORIZED_MESSAGE },
      { status: 401 },
    );
  }
  return { session };
}

export function isUnauthorizedResponse(
  result: { session: SessionData } | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    redirect(routes.signIn);
  }
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) {
    redirect(routes.vault);
  }
}
