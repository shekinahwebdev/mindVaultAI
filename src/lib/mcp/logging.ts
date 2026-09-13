/**
 * Safe observability for MCP tool calls.
 *
 * Deliberately mirrors the shape of the existing [ai:*]/[agent:run] logs
 * elsewhere in the codebase (operation, ok, latencyMs) rather than
 * inventing a new format.
 *
 * IMPORTANT: the stdio transport uses stdout exclusively as the JSON-RPC
 * wire — anything else written to stdout corrupts the protocol stream.
 * This is why every log call here goes to stderr (console.error), never
 * console.log, regardless of whether it represents an error.
 */
export function logMcpToolCall(entry: {
  toolName: string;
  userId: string;
  startedAt: number;
  ok: boolean;
  errorReason?: string;
}) {
  console.error("[mcp:tool]", {
    operation: "mcp_tool",
    toolName: entry.toolName,
    // The user this server is acting as — an internal opaque id, not a
    // credential. Never log note/category content, API keys, or session
    // secrets here.
    userId: entry.userId,
    ok: entry.ok,
    latencyMs: Date.now() - entry.startedAt,
    ...(entry.errorReason ? { errorReason: entry.errorReason } : {}),
  });
}
