import { NoteType } from "@/generated/prisma/enums";

export type CaptureNoteTypeOption = {
  value: NoteType;
  label: string;
};

export const captureNoteTypeOptions: CaptureNoteTypeOption[] = [
  { value: NoteType.NOTE, label: "Note" },
  { value: NoteType.LINK, label: "Link" },
  { value: NoteType.QUOTE, label: "Quote" },
  { value: NoteType.CODE, label: "Code" },
  { value: NoteType.ARTICLE, label: "Article" },
  { value: NoteType.OTHER, label: "Other" },
];

export const CAPTURE_DEFAULT_TYPE = NoteType.NOTE;

export const CAPTURE_SUCCESS_MESSAGE = "Saved to your vault.";

export const CAPTURE_SERVER_ERROR =
  "Something went wrong. Please try again.";

export const CAPTURE_UNAUTHORIZED =
  "Your session expired. Please sign in again.";

export const CAPTURE_DISCARD_CONFIRM =
  "Discard this capture? Your unsaved work will be lost.";

export const CAPTURE_ANALYZE_MIN_LENGTH = 20;

export const CAPTURE_ANALYZE_LABEL = "Analyze with AI";

export const CAPTURE_ANALYZING_LABEL = "MindVault is organizing this...";

export const CAPTURE_ANALYZE_ERROR =
  "MindVault couldn't analyze this right now. You can still organize and save it manually.";

export const CAPTURE_SUGGESTED_LABEL = "Suggested by MindVault";
