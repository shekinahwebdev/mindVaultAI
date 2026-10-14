export type GenerationAttempt<T> =
  | { outcome: "success"; value: T; inputTokens?: number; outputTokens?: number }
  | { outcome: "invalid_output" }
  | { outcome: "error"; error: unknown };

export async function runGenerationWithRetry<T>(params: {
  attempt: () => Promise<GenerationAttempt<T>>;
  isRetryable: (error: unknown) => boolean;
}): Promise<GenerationAttempt<T>> {
  let result = await params.attempt();

  if (result.outcome === "invalid_output") {
    result = await params.attempt();
  } else if (result.outcome === "error" && params.isRetryable(result.error)) {
    result = await params.attempt();
  }

  return result;
}
