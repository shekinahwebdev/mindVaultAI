import { NoteType } from "@/generated/prisma/enums";
import { readAuthJson } from "@/lib/auth/client";

import type { CaptureCreatePayload, CaptureFormValues } from "./capture-validation";
import type { SerializedNote } from "./serialize";

export type { SerializedNote };

export type CreateNoteApiResponse =
  | { ok: true; note: SerializedNote }
  | {
      ok: false;
      errors?: Partial<
        Record<
          "title" | "content" | "type" | "sourceUrl" | "categoryId" | "tagIds",
          string
        >
      >;
      message?: string;
    };

export const emptyCaptureValues: CaptureFormValues = {
  content: "",
  title: "",
  type: "NOTE",
  sourceUrl: "",
  categoryId: "",
  tagIds: [],
};

export {
  captureFormIsDirty,
  validateCaptureForm,
  type CaptureFormValues,
} from "./capture-validation";

export function buildCreateNoteRequestBody(
  payload: CaptureCreatePayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
    type: payload.type,
    tagIds: payload.tagIds,
  };

  if (payload.sourceUrl) {
    body.sourceUrl = payload.sourceUrl;
  }

  if (payload.categoryId) {
    body.categoryId = payload.categoryId;
  }

  return body;
}

export async function createNoteRequest(payload: CaptureCreatePayload) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildCreateNoteRequestBody(payload)),
  });

  const data = await readAuthJson<CreateNoteApiResponse>(response);
  return { response, data };
}

export type GetNoteResponse =
  | { ok: true; note: SerializedNote }
  | { ok: false; message?: string };

export type UpdateNoteApiResponse =
  | { ok: true; note: SerializedNote }
  | {
      ok: false;
      errors?: Partial<
        Record<
          "title" | "content" | "type" | "sourceUrl" | "categoryId" | "tagIds",
          string
        >
      >;
      message?: string;
    };

export type DeleteNoteApiResponse =
  | { ok: true }
  | { ok: false; message?: string };

export function buildUpdateNoteRequestBody(payload: CaptureCreatePayload) {
  return {
    title: payload.title,
    content: payload.content,
    type: payload.type,
    sourceUrl: payload.sourceUrl,
    categoryId: payload.categoryId,
    tagIds: payload.tagIds,
  };
}

export async function fetchNote(id: string) {
  const response = await fetch(`/api/notes/${id}`);
  const data = await readAuthJson<GetNoteResponse>(response);
  return { response, data };
}

export async function updateNoteRequest(
  id: string,
  payload: CaptureCreatePayload,
) {
  const response = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildUpdateNoteRequestBody(payload)),
  });

  const data = await readAuthJson<UpdateNoteApiResponse>(response);
  return { response, data };
}

export async function deleteNoteRequest(id: string) {
  const response = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
  });

  const data = await readAuthJson<DeleteNoteApiResponse>(response);
  return { response, data };
}

export const NOTE_DELETE_FLASH_KEY = "vault-note-delete-flash";

export type AnalyzeTagSuggestions = {
  existing: Array<{ id: string; name: string }>;
  new: string[];
};

export type NoteAnalysisSuggestion = {
  title: string;
  type: NoteType;
  categoryId: string | null;
  tags: AnalyzeTagSuggestions;
};

export type AnalyzeNoteApiResponse =
  | { ok: true; suggestion: NoteAnalysisSuggestion }
  | { ok: false; message?: string };

export async function analyzeNoteRequest(
  content: string,
  options?: { signal?: AbortSignal; selectedTagIds?: string[] },
) {
  const response = await fetch("/api/notes/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      tagIds: options?.selectedTagIds ?? [],
    }),
    signal: options?.signal,
  });

  const data = await readAuthJson<AnalyzeNoteApiResponse>(response);
  return { response, data };
}
