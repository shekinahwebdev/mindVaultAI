import { NoteType, SearchMode } from "@/generated/prisma/enums";

const NOTE_TYPES = new Set<string>(Object.values(NoteType));
const SEARCH_MODES = new Set<string>(Object.values(SearchMode));

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type UpdateAccountPayload = {
  name: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type UpdatePreferencesPayload = {
  defaultNoteType?: string;
  defaultCategoryId?: string | null;
  defaultSearchMode?: string;
  aiAssistanceEnabled?: boolean;
  ragEnabled?: boolean;
  reducedMotion?: boolean;
};

export type DeleteAccountPayload = {
  currentPassword: string;
  confirmation: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseUpdateAccountBody(body: unknown):
  | { success: true; data: UpdateAccountPayload }
  | { success: false; errors: FieldErrors<UpdateAccountPayload> } {
  if (!isRecord(body)) {
    return { success: false, errors: { name: "Invalid request." } };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const errors: FieldErrors<UpdateAccountPayload> = {};

  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length < 2) {
    errors.name = "Name needs at least 2 characters.";
  } else if (name.length > 120) {
    errors.name = "Name must be at most 120 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name } };
}

export function parseChangePasswordBody(body: unknown):
  | { success: true; data: ChangePasswordPayload }
  | { success: false; errors: FieldErrors<ChangePasswordPayload> } {
  if (!isRecord(body)) {
    return { success: false, errors: { currentPassword: "Invalid request." } };
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  const errors: FieldErrors<ChangePasswordPayload> = {};

  if (!currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }

  if (!newPassword) {
    errors.newPassword = "Enter a new password.";
  } else if (newPassword.length < 8) {
    errors.newPassword = "Password needs at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (
    currentPassword &&
    newPassword &&
    currentPassword === newPassword
  ) {
    errors.newPassword = "New password must be different from your current password.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { currentPassword, newPassword, confirmPassword },
  };
}

export function parseUpdatePreferencesBody(body: unknown):
  | { success: true; data: UpdatePreferencesPayload }
  | { success: false; errors: FieldErrors<UpdatePreferencesPayload> } {
  if (!isRecord(body)) {
    return { success: false, errors: { defaultNoteType: "Invalid request." } };
  }

  const data: UpdatePreferencesPayload = {};
  const errors: FieldErrors<UpdatePreferencesPayload> = {};

  if ("defaultNoteType" in body) {
    const value =
      typeof body.defaultNoteType === "string" ? body.defaultNoteType : "";
    if (!NOTE_TYPES.has(value)) {
      errors.defaultNoteType = "Invalid note type.";
    } else {
      data.defaultNoteType = value;
    }
  }

  if ("defaultCategoryId" in body) {
    if (body.defaultCategoryId === null || body.defaultCategoryId === "") {
      data.defaultCategoryId = null;
    } else if (typeof body.defaultCategoryId === "string") {
      const trimmed = body.defaultCategoryId.trim();
      data.defaultCategoryId = trimmed || null;
    } else {
      errors.defaultCategoryId = "Invalid category.";
    }
  }

  if ("defaultSearchMode" in body) {
    const value =
      typeof body.defaultSearchMode === "string" ? body.defaultSearchMode : "";
    if (!SEARCH_MODES.has(value)) {
      errors.defaultSearchMode = "Invalid search mode.";
    } else {
      data.defaultSearchMode = value;
    }
  }

  if ("aiAssistanceEnabled" in body) {
    if (typeof body.aiAssistanceEnabled !== "boolean") {
      errors.aiAssistanceEnabled = "Invalid value.";
    } else {
      data.aiAssistanceEnabled = body.aiAssistanceEnabled;
    }
  }

  if ("ragEnabled" in body) {
    if (typeof body.ragEnabled !== "boolean") {
      errors.ragEnabled = "Invalid value.";
    } else {
      data.ragEnabled = body.ragEnabled;
    }
  }

  if ("reducedMotion" in body) {
    if (typeof body.reducedMotion !== "boolean") {
      errors.reducedMotion = "Invalid value.";
    } else {
      data.reducedMotion = body.reducedMotion;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return { success: false, errors: { defaultNoteType: "Nothing to update." } };
  }

  return { success: true, data };
}

export function parseDeleteAccountBody(body: unknown):
  | { success: true; data: DeleteAccountPayload }
  | { success: false; errors: FieldErrors<DeleteAccountPayload> } {
  if (!isRecord(body)) {
    return { success: false, errors: { confirmation: "Invalid request." } };
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const confirmation =
    typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  const errors: FieldErrors<DeleteAccountPayload> = {};

  if (!currentPassword) {
    errors.currentPassword = "Enter your password to confirm.";
  }

  if (confirmation !== "DELETE") {
    errors.confirmation = 'Type DELETE to confirm.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { currentPassword, confirmation } };
}
