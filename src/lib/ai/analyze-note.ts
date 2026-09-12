import { ApiError, GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

import { NoteType } from "@/generated/prisma/enums";

import type { NoteAnalysisInput, NoteAnalysisResult } from "./types";

// gemini-3.5-flash-lite: Google's current fastest/cheapest stable model,
// suited to lightweight classification/extraction (no need for a reasoning
// model here). gemini-2.5-flash-lite is being retired (Oct 2026), so we skip it.
const MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 15_000;

const NOTE_TYPE_VALUES = Object.values(NoteType) as [NoteType, ...NoteType[]];

const NoteAnalysisSchema = z.object({
  title: z.string(),
  type: z.enum(NOTE_TYPE_VALUES),
  category: z.string().nullable(),
});

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING, format: "enum", enum: NOTE_TYPE_VALUES },
    category: { type: Type.STRING, nullable: true },
  },
  required: ["title", "type", "category"],
};

const SYSTEM_INSTRUCTION = `You are the knowledge organization component of MindVault, a personal knowledge vault.

Given content supplied by the user, you will:
1. Generate a concise, useful title for it.
2. Classify it into exactly one of the allowed note types.
3. Choose the single most appropriate category from the user's existing categories.

Allowed note types: NOTE, LINK, QUOTE, CODE, ARTICLE, OTHER.

Rules:
- The title must be concise. Do not invent facts that are not present in the content.
- Do not rewrite, paraphrase, or summarize the user's content itself — only use it to choose a title, type, and category.
- Strongly prefer an existing category from the list provided over inventing a new one.
- If none of the existing categories clearly fit, return null for category. Never force an unrelated category.
- Return only the requested structured fields.`;

function buildUserMessage({ content, categoryNames }: NoteAnalysisInput) {
  const categoriesLine =
    categoryNames.length > 0
      ? `Existing categories: ${categoryNames.join(", ")}`
      : "Existing categories: (none yet)";

  return `${categoriesLine}\n\nContent to analyze:\n"""\n${content}\n"""`;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500;
  }
  // A request that hit our own client-side timeout (AbortController) is a
  // transient condition worth one retry, same as a dropped connection.
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return true;
  }
  return false;
}

function classifyFailure(
  error: unknown,
): "timeout" | "rate_limit" | "provider_error" {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "rate_limit";
    }
    return "provider_error";
  }
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return "timeout";
  }
  return "provider_error";
}

/**
 * Gemini's responseSchema constrains the *shape* of the JSON, but the model
 * output is still untrusted input — parse it through the same Zod schema
 * used to build the request rather than trusting it as-is.
 */
function parseSuggestion(text: string | undefined): z.infer<typeof NoteAnalysisSchema> | null {
  if (!text) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const result = NoteAnalysisSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

async function attemptAnalyze(
  client: GoogleGenAI,
  input: NoteAnalysisInput,
): Promise<
  | { outcome: "success"; suggestion: z.infer<typeof NoteAnalysisSchema>; inputTokens?: number; outputTokens?: number }
  | { outcome: "invalid_output" }
  | { outcome: "error"; error: unknown }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: buildUserMessage(input),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    const suggestion = parseSuggestion(response.text);
    if (!suggestion) {
      return { outcome: "invalid_output" };
    }

    return {
      outcome: "success",
      suggestion,
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    };
  } catch (error) {
    return { outcome: "error", error };
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeNote(
  input: NoteAnalysisInput,
): Promise<NoteAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const startedAt = Date.now();

  if (!apiKey) {
    return {
      ok: false,
      reason: "provider_error",
      meta: { model: MODEL, latencyMs: Date.now() - startedAt },
    };
  }

  const client = new GoogleGenAI({ apiKey });

  let attempt = await attemptAnalyze(client, input);

  if (attempt.outcome === "invalid_output") {
    attempt = await attemptAnalyze(client, input);
  } else if (attempt.outcome === "error" && isRetryable(attempt.error)) {
    attempt = await attemptAnalyze(client, input);
  }

  const latencyMs = Date.now() - startedAt;

  if (attempt.outcome === "success") {
    return {
      ok: true,
      suggestion: attempt.suggestion,
      meta: {
        model: MODEL,
        latencyMs,
        inputTokens: attempt.inputTokens,
        outputTokens: attempt.outputTokens,
      },
    };
  }

  if (attempt.outcome === "invalid_output") {
    return {
      ok: false,
      reason: "invalid_output",
      meta: { model: MODEL, latencyMs },
    };
  }

  return {
    ok: false,
    reason: classifyFailure(attempt.error),
    meta: { model: MODEL, latencyMs },
  };
}
