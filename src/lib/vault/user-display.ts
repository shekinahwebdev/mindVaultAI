import type { SessionData } from "@/lib/auth/session";

export function getVaultTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function getVaultGreetingName(session: SessionData) {
  const trimmed = session.name?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0];
  }

  const localPart = session.email.split("@")[0]?.trim();
  return localPart || "there";
}

export function getVaultInitials(session: SessionData) {
  const trimmed = session.name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase() || "?";
  }

  return session.email[0]?.toUpperCase() ?? "?";
}
