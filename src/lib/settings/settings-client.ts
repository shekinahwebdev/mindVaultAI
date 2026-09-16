import { readAuthJson } from "@/lib/auth/client";

import type {
  SerializedAccount,
  SerializedPreferences,
  SettingsBundle,
  VaultStorageStats,
} from "./settings-queries";

export type SettingsResponse =
  | { ok: true; account: SerializedAccount; preferences: SerializedPreferences; storage: VaultStorageStats }
  | { ok: false; message?: string };

export type AccountUpdateResponse =
  | { ok: true; account: SerializedAccount }
  | { ok: false; errors?: Record<string, string>; message?: string };

export type PasswordUpdateResponse =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

export type PreferencesUpdateResponse =
  | { ok: true; preferences: SerializedPreferences }
  | { ok: false; errors?: Record<string, string>; message?: string };

export type EmbeddingsStatusResponse =
  | {
      ok: true;
      embeddedNotes: number;
      missingEmbeddings: number;
      totalNotes: number;
    }
  | { ok: false; message?: string };

export type EmbeddingsRebuildResponse =
  | { ok: true; total: number; succeeded: number; failed: number }
  | { ok: false; message?: string };

export async function fetchSettings() {
  const response = await fetch("/api/settings");
  const data = await readAuthJson<SettingsResponse>(response);
  return { response, data };
}

export async function updateAccountRequest(name: string) {
  const response = await fetch("/api/settings/account", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await readAuthJson<AccountUpdateResponse>(response);
  return { response, data };
}

export async function changePasswordRequest(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const response = await fetch("/api/settings/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readAuthJson<PasswordUpdateResponse>(response);
  return { response, data };
}

export async function updatePreferencesRequest(
  payload: Partial<SerializedPreferences>,
) {
  const response = await fetch("/api/settings/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readAuthJson<PreferencesUpdateResponse>(response);
  return { response, data };
}

export async function deleteAccountRequest(payload: {
  currentPassword: string;
  confirmation: string;
}) {
  const response = await fetch("/api/settings/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readAuthJson<{ ok: true } | { ok: false; errors?: Record<string, string>; message?: string }>(
    response,
  );
  return { response, data };
}

export async function fetchEmbeddingsStatus() {
  const response = await fetch("/api/settings/embeddings");
  const data = await readAuthJson<EmbeddingsStatusResponse>(response);
  return { response, data };
}

export async function rebuildEmbeddingsRequest() {
  const response = await fetch("/api/settings/embeddings", {
    method: "POST",
  });
  const data = await readAuthJson<EmbeddingsRebuildResponse>(response);
  return { response, data };
}

export function exportVaultDownloadUrl() {
  return "/api/settings/export";
}

export type { SettingsBundle };
