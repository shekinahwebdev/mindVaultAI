import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "mindvault_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionData = {
  userId: string;
  email: string;
  name: string | null;
};

type SignedSessionPayload = SessionData & {
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSession(data: SessionData) {
  const payload: SignedSessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

function decodeSession(token: string): SessionData | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) {
    return null;
  }

  const encoded = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SignedSessionPayload;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setSession(data: SessionData) {
  const token = encodeSession(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return decodeSession(token);
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));
}
