import { analyzeNoteWithOpenAI } from "./analyze-note-openai";
import type { NoteAnalysisInput, NoteAnalysisResult } from "./types";

/** Capture note analysis — OpenAI structured JSON (gpt-4o-mini by default). */
export async function analyzeNote(input: NoteAnalysisInput): Promise<NoteAnalysisResult> {
  return analyzeNoteWithOpenAI(input);
}
