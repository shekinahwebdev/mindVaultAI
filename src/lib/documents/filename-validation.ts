const MAX_FILENAME_LENGTH = 255;

const UNSAFE_FILENAME = /[\0\r\n/\\<>:"|?*\u0000-\u001f]/;

export function sanitizeDisplayFilename(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "document.pdf";
  }
  const base = trimmed.replace(/[/\\]/g, "_").slice(0, MAX_FILENAME_LENGTH);
  return base.length > 0 ? base : "document.pdf";
}

export function parseUploadFilename(raw: unknown):
  | { ok: true; filename: string; title: string }
  | { ok: false; message: string } {
  if (typeof raw !== "string") {
    return { ok: false, message: "Filename is required." };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_FILENAME_LENGTH) {
    return { ok: false, message: "Invalid filename." };
  }

  if (UNSAFE_FILENAME.test(trimmed)) {
    return { ok: false, message: "Filename contains invalid characters." };
  }

  const lower = trimmed.toLowerCase();
  if (!lower.endsWith(".pdf")) {
    return { ok: false, message: "Only PDF files are supported." };
  }

  const safe = sanitizeDisplayFilename(trimmed);
  const title = safe.replace(/\.pdf$/i, "").trim() || "Document";

  return { ok: true, filename: safe, title };
}
