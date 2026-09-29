import {
  MAX_TAG_NAME_LENGTH,
  type TagNameFieldErrors,
} from "./tag-errors";
import {
  normalizeTagDisplayName,
  normalizeTagName,
} from "./tag-normalization";

export type TagNameInput = {
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTagName(raw: string): string | undefined {
  if (typeof raw !== "string") {
    return "Tag name must be a string.";
  }

  const name = normalizeTagDisplayName(raw);

  if (!name) {
    return "Enter a tag name.";
  }

  if (name.length > MAX_TAG_NAME_LENGTH) {
    return `Keep tag names under ${MAX_TAG_NAME_LENGTH} characters.`;
  }

  const normalizedName = normalizeTagName(raw);
  if (!normalizedName) {
    return "Enter a tag name.";
  }

  return undefined;
}

const FORBIDDEN_TAG_BODY_FIELDS = [
  "userId",
  "id",
  "normalizedName",
  "noteCount",
  "color",
  "createdAt",
  "updatedAt",
] as const;

function rejectForbiddenFields(body: Record<string, unknown>): boolean {
  return FORBIDDEN_TAG_BODY_FIELDS.some((field) => field in body);
}

export function parseCreateTagBody(body: unknown):
  | { success: true; data: TagNameInput }
  | { success: false; errors: TagNameFieldErrors } {
  if (!isRecord(body)) {
    return { success: false, errors: { name: "Invalid request." } };
  }

  if (rejectForbiddenFields(body)) {
    return { success: false, errors: { name: "Invalid request." } };
  }

  const rawName = typeof body.name === "string" ? body.name : "";
  const nameError = validateTagName(rawName);
  if (nameError) {
    return { success: false, errors: { name: nameError } };
  }

  return {
    success: true,
    data: { name: normalizeTagDisplayName(rawName) },
  };
}

export function parseRenameTagBody(body: unknown):
  | { success: true; data: TagNameInput }
  | { success: false; errors: TagNameFieldErrors } {
  if (!isRecord(body)) {
    return { success: false, errors: { name: "Invalid request." } };
  }

  if (rejectForbiddenFields(body)) {
    return { success: false, errors: { name: "Invalid request." } };
  }

  if (!("name" in body)) {
    return { success: false, errors: { name: "Enter a tag name." } };
  }

  const rawName = typeof body.name === "string" ? body.name : "";
  const nameError = validateTagName(rawName);
  if (nameError) {
    return { success: false, errors: { name: nameError } };
  }

  return {
    success: true,
    data: { name: normalizeTagDisplayName(rawName) },
  };
}
