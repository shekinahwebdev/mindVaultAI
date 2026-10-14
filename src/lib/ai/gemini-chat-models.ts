/**
 * Generative chat models (RAG answers, grounded follow-ups, agent).
 *
 * gemini-3.5-flash-lite: stable, supports JSON schema for RAG, and tends to
 * stay available when gemini-3.5-flash returns 503 under load (observed in prod-like dev).
 */
export const GEMINI_CHAT_GENERATION_MODEL = "gemini-3.5-flash-lite";
