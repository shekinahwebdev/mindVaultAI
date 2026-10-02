import {
  CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER,
  CHAT_PROVIDER_FAILURE_MESSAGE,
} from "@/lib/chat/chat-outcomes";
import type { DirectGroundedTurn } from "@/lib/chat/grounded-turn";
import { isLikelyGroundedFollowUp } from "@/lib/chat/grounded-follow-up";

import { answerFromGroundedHistory } from "./answer-from-grounded-history";
import { answerQuestion, RAG_GENERATION_MODEL } from "./answer-question";
import { buildRetrievalQuery } from "./build-retrieval-query";
import {
  conversationHistoryCharCount,
  type ConversationContextMessage,
} from "./conversation-context";
import { retrieveRagContext } from "./retrieve-context";
import { UsageEventType } from "@/generated/prisma/enums";
import { noopAskVaultBilling } from "@/lib/billing/billing-noop";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { recordAiUsage } from "@/lib/billing/usage-metering";

import type { AskVaultResult, RagSource } from "./types";

/** @deprecated Use CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER */
export const RAG_NO_ANSWER_MESSAGE = CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER;

/** @deprecated Use CHAT_PROVIDER_FAILURE_MESSAGE */
export const RAG_UNAVAILABLE_MESSAGE = CHAT_PROVIDER_FAILURE_MESSAGE;

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 500;

export type AskVaultInput = {
  userId: string;
  question: string;
  conversationHistory?: ConversationContextMessage[];
  /** Most recent turn grounded directly from vault retrieval (not history fallback). */
  recentDirectGroundedTurn?: DirectGroundedTurn | null;
};

import type { AskVaultBilling } from "@/lib/billing/ask-vault-billing";

export type { AskVaultBilling };

export type AskVaultDependencies = {
  retrieve: typeof retrieveRagContext;
  answer: typeof answerQuestion;
  answerFromGroundedHistory: typeof answerFromGroundedHistory;
  billing: AskVaultBilling;
};

const defaultBilling: AskVaultBilling = {
  beforeGenerativeCall: async (userId) => {
    const entitlements = await getUserEntitlements(userId);
    if (entitlements.aiRequests.remaining <= 0) {
      return { ok: false, reason: "ai_limit_reached" };
    }
    return null;
  },
  afterGenerativeSuccess: async (userId) => {
    await recordAiUsage(userId, UsageEventType.AI_CHAT);
  },
};

const defaultDependencies: AskVaultDependencies = {
  retrieve: retrieveRagContext,
  answer: answerQuestion,
  answerFromGroundedHistory,
  billing: defaultBilling,
};

export async function askVault(
  input: AskVaultInput,
  dependencies: Partial<AskVaultDependencies> = {},
): Promise<AskVaultResult> {
  return runAskVaultPipeline(input, dependencies);
}

export async function runAskVaultPipeline(
  input: AskVaultInput,
  dependencies: Partial<AskVaultDependencies> = {},
): Promise<AskVaultResult> {
  const inNodeTest = process.env.NODE_TEST_CONTEXT !== undefined;
  const deps: AskVaultDependencies = {
    ...defaultDependencies,
    ...dependencies,
    billing:
      dependencies.billing ??
      (inNodeTest ? noopAskVaultBilling : defaultDependencies.billing),
  };

  const question = input.question.trim();
  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    return { ok: false, reason: "invalid_question" };
  }

  const history = input.conversationHistory ?? [];
  const retrievalQuery = buildRetrievalQuery(question, history);

  const totalStartedAt = Date.now();
  const retrievalStartedAt = Date.now();
  const retrieval = await deps.retrieve(input.userId, retrievalQuery);
  const retrievalLatencyMs = Date.now() - retrievalStartedAt;

  if (!retrieval.ok) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      outcome: "provider_failure",
      stage: "retrieval",
      reason: retrieval.reason,
      historyMessageCount: history.length,
      historyCharCount: conversationHistoryCharCount(history),
      retrievalQueryCharCount: retrievalQuery.length,
      retrievalLatencyMs,
      totalLatencyMs: Date.now() - totalStartedAt,
    });
    return { ok: false, reason: "provider_failure" };
  }

  const sources = retrieval.sources;

  if (sources.length === 0) {
    const fallbackResult = await tryGroundedHistoryFallback({
      userId: input.userId,
      billing: deps.billing,
      question,
      history,
      retrievalQuery,
      retrievalLatencyMs,
      totalStartedAt,
      groundedTurn: input.recentDirectGroundedTurn ?? null,
      answerFromGroundedHistory: deps.answerFromGroundedHistory,
    });

    if (fallbackResult) {
      return fallbackResult;
    }

    console.log("[rag:ask]", {
      operation: "rag_answer",
      outcome: "no_relevant_knowledge",
      retrievedCount: 0,
      usedSourceCount: 0,
      historyMessageCount: history.length,
      historyCharCount: conversationHistoryCharCount(history),
      retrievalQueryCharCount: retrievalQuery.length,
      retrievalLatencyMs,
      generationLatencyMs: 0,
      totalLatencyMs: Date.now() - totalStartedAt,
    });
    return {
      ok: true,
      outcome: "no_relevant_knowledge",
      answer: CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER,
      sources: [],
    };
  }

  const blocked = await deps.billing.beforeGenerativeCall(input.userId);
  if (blocked) {
    return blocked;
  }

  const generationStartedAt = Date.now();
  const generation = await deps.answer({
    question,
    sources,
    conversationHistory: history,
  });
  const generationLatencyMs = Date.now() - generationStartedAt;

  if (!generation.ok) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      outcome: "provider_failure",
      stage: "generation",
      reason: generation.reason,
      retrievedCount: sources.length,
      historyMessageCount: history.length,
      historyCharCount: conversationHistoryCharCount(history),
      retrievalQueryCharCount: retrievalQuery.length,
      retrievalLatencyMs,
      generationLatencyMs,
      totalLatencyMs: Date.now() - totalStartedAt,
    });
    return { ok: false, reason: "provider_failure" };
  }

  const validSourceNumbers = new Set(sources.map((source) => source.sourceNumber));
  const citedNumbers = [...new Set(generation.answer.sourceNumbers)].filter((number) =>
    validSourceNumbers.has(number),
  );

  const citedSources: RagSource[] =
    citedNumbers.length > 0
      ? sources.filter((source) => citedNumbers.includes(source.sourceNumber))
      : sources;

  await deps.billing.afterGenerativeSuccess(input.userId);

  console.log("[rag:ask]", {
    operation: "rag_answer",
    outcome: "answered",
    model: generation.meta.model,
    retrievedCount: sources.length,
    usedSourceCount: citedSources.length,
    historyMessageCount: history.length,
    historyCharCount: conversationHistoryCharCount(history),
    retrievalQueryCharCount: retrievalQuery.length,
    retrievalLatencyMs,
    generationLatencyMs,
    totalLatencyMs: Date.now() - totalStartedAt,
    inputTokens: generation.meta.inputTokens,
    outputTokens: generation.meta.outputTokens,
  });

  return {
    ok: true,
    outcome: "answered",
    answer: generation.answer.answer,
    sources: citedSources.map((source) => ({
      noteId: source.noteId,
      title: source.title,
      categoryName: source.categoryName,
      type: source.type,
    })),
  };
}

async function tryGroundedHistoryFallback(params: {
  userId: string;
  billing: AskVaultBilling;
  question: string;
  history: ConversationContextMessage[];
  retrievalQuery: string;
  retrievalLatencyMs: number;
  totalStartedAt: number;
  groundedTurn: DirectGroundedTurn | null;
  answerFromGroundedHistory: typeof answerFromGroundedHistory;
}): Promise<AskVaultResult | null> {
  const { groundedTurn, question } = params;

  if (!groundedTurn || !isLikelyGroundedFollowUp(question)) {
    return null;
  }

  const blocked = await params.billing.beforeGenerativeCall(params.userId);
  if (blocked) {
    return blocked;
  }

  const generationStartedAt = Date.now();
  const generation = await params.answerFromGroundedHistory({
    priorUserQuestion: groundedTurn.userQuestion,
    priorAssistantAnswer: groundedTurn.assistantAnswer,
    currentQuestion: question,
  });
  const generationLatencyMs = Date.now() - generationStartedAt;

  if (!generation.ok) {
    console.log("[rag:ask]", {
      operation: "rag_answer",
      outcome: "provider_failure",
      stage: "grounded_history_generation",
      reason: generation.reason,
      groundedFromMessageId: groundedTurn.assistantMessageId,
      sourceCount: groundedTurn.sources.length,
      historyMessageCount: params.history.length,
      historyCharCount: conversationHistoryCharCount(params.history),
      retrievalQueryCharCount: params.retrievalQuery.length,
      retrievalLatencyMs: params.retrievalLatencyMs,
      generationLatencyMs,
      totalLatencyMs: Date.now() - params.totalStartedAt,
    });
    return { ok: false, reason: "provider_failure" };
  }

  await params.billing.afterGenerativeSuccess(params.userId);

  console.log("[rag:ask]", {
    operation: "rag_answer",
    outcome: "answered_from_grounded_history",
    model: generation.meta.model,
    retrievedCount: 0,
    usedSourceCount: groundedTurn.sources.length,
    groundedFromMessageId: groundedTurn.assistantMessageId,
    historyMessageCount: params.history.length,
    historyCharCount: conversationHistoryCharCount(params.history),
    retrievalQueryCharCount: params.retrievalQuery.length,
    retrievalLatencyMs: params.retrievalLatencyMs,
    generationLatencyMs,
    totalLatencyMs: Date.now() - params.totalStartedAt,
    inputTokens: generation.meta.inputTokens,
    outputTokens: generation.meta.outputTokens,
  });

  return {
    ok: true,
    outcome: "answered_from_grounded_history",
    answer: generation.answer,
    sources: groundedTurn.sources,
    groundedFromMessageId: groundedTurn.assistantMessageId,
  };
}

export const RAG_MODEL = RAG_GENERATION_MODEL;
