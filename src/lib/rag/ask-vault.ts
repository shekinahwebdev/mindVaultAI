import { answerQuestion, RAG_GENERATION_MODEL } from "./answer-question";
import { retrieveRagContext } from "./retrieve-context";
import type { AskVaultResult, RagSource } from "./types";

export const RAG_NO_ANSWER_MESSAGE =
  "Your vault doesn't contain enough relevant saved information to answer that yet.";
export const RAG_UNAVAILABLE_MESSAGE =
  "MindVault couldn't answer from your vault right now. Your saved knowledge is still safe.";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 500;

/**
 * The full RAG pipeline for one question: retrieval -> relevance gate ->
 * generation -> citation validation -> response shaping. This is the
 * only function the API route calls — see build-context.ts,
 * retrieve-context.ts and answer-question.ts for the individual R/A/G
 * pieces this composes.
 */
export async function askVault(userId: string, rawQuestion: string): Promise<AskVaultResult> {
  const question = rawQuestion.trim();
  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    return { ok: false, reason: "invalid_question" };
  }

  const totalStartedAt = Date.now();
  const retrievalStartedAt = Date.now();
  const retrieval = await retrieveRagContext(userId, question);
  const retrievalLatencyMs = Date.now() - retrievalStartedAt;

  if (!retrieval.ok) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      provider: "gemini",
      ok: false,
      stage: "retrieval",
      reason: retrieval.reason,
      retrievalLatencyMs,
      totalLatencyMs: Date.now() - totalStartedAt,
    });
    return { ok: false, reason: "unavailable" };
  }

  const sources = retrieval.sources;

  // Deterministic no-answer: below the relevance threshold, we never
  // spend a generation call at all. This is stronger than trusting the
  // model to refuse on its own — it's not a judgment call, there is
  // simply nothing worth sending as context.
  if (sources.length === 0) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      provider: "gemini",
      ok: true,
      retrievedCount: 0,
      usedSourceCount: 0,
      retrievalLatencyMs,
      generationLatencyMs: 0,
      totalLatencyMs: Date.now() - totalStartedAt,
      reason: "no_relevant_sources",
    });
    return { ok: true, answer: RAG_NO_ANSWER_MESSAGE, sources: [] };
  }

  const generationStartedAt = Date.now();
  const generation = await answerQuestion(question, sources);
  const generationLatencyMs = Date.now() - generationStartedAt;

  if (!generation.ok) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      provider: "gemini",
      model: generation.meta.model,
      ok: false,
      stage: "generation",
      reason: generation.reason,
      retrievedCount: sources.length,
      retrievalLatencyMs,
      generationLatencyMs,
      totalLatencyMs: Date.now() - totalStartedAt,
    });
    return { ok: false, reason: "unavailable" };
  }

  // Never trust model-cited source numbers blindly: keep only numbers
  // that are within the set actually retrieved for this request, dedupe
  // them, and map back to the real note metadata the server itself
  // fetched — the model never sees or returns a database id, so there
  // is no invented-id case to defend against, only out-of-range numbers.
  const validSourceNumbers = new Set(sources.map((source) => source.sourceNumber));
  const citedNumbers = [...new Set(generation.answer.sourceNumbers)].filter((number) =>
    validSourceNumbers.has(number),
  );

  const citedSources: RagSource[] =
    citedNumbers.length > 0
      ? sources.filter((source) => citedNumbers.includes(source.sourceNumber))
      : sources; // model gave a grounded answer but cited nothing specific — show all retrieved sources it had access to

  console.log("[rag:ask]", {
    operation: "rag_answer",
    provider: "gemini",
    model: generation.meta.model,
    ok: true,
    retrievedCount: sources.length,
    usedSourceCount: citedSources.length,
    retrievalLatencyMs,
    generationLatencyMs,
    totalLatencyMs: Date.now() - totalStartedAt,
    inputTokens: generation.meta.inputTokens,
    outputTokens: generation.meta.outputTokens,
  });

  return {
    ok: true,
    answer: generation.answer.answer,
    sources: citedSources.map((source) => ({
      noteId: source.noteId,
      title: source.title,
      categoryName: source.categoryName,
      type: source.type,
    })),
  };
}

export const RAG_MODEL = RAG_GENERATION_MODEL;
