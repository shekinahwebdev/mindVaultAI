const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export type CollectionFieldErrors = {
  name?: string;
  description?: string;
};

export function parseCollectionName(raw: unknown): { ok: true; name: string } | { ok: false; errors: CollectionFieldErrors } {
  if (typeof raw !== "string") {
    return { ok: false, errors: { name: "Name is required." } };
  }
  const name = raw.trim();
  if (!name) {
    return { ok: false, errors: { name: "Name is required." } };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, errors: { name: `Name must be at most ${MAX_NAME_LENGTH} characters.` } };
  }
  return { ok: true, name };
}

export function parseCollectionDescription(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
}

export function parseCollectionItemBody(raw: unknown):
  | { ok: true; kind: "note" | "document"; itemId: string }
  | { ok: false; message: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, message: "Invalid request body." };
  }
  const record = raw as Record<string, unknown>;
  const kind = record.kind;
  const itemId = typeof record.itemId === "string" ? record.itemId.trim() : "";
  if (kind !== "note" && kind !== "document") {
    return { ok: false, message: "Item kind must be note or document." };
  }
  if (!itemId) {
    return { ok: false, message: "Item id is required." };
  }
  return { ok: true, kind, itemId };
}
