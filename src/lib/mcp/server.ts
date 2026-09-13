import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  executeGetNote,
  executeListCategories,
  executeSearchVault,
} from "@/lib/agent/tool-executors";

import type { McpIdentity } from "./identity";
import { logMcpToolCall } from "./logging";

/**
 * The MCP adapter layer for MindVault.
 *
 * Every tool/resource handler below calls straight into the exact same
 * functions the Gemini agent already uses (src/lib/agent/tool-executors.ts)
 * — search, note lookup, and category listing are NOT reimplemented here.
 * This file's only job is translating between the MCP protocol shapes
 * (registerTool/registerResource/registerPrompt, CallToolResult, etc.)
 * and those existing, already-validated, already-ownership-scoped
 * functions. Nothing here talks to Prisma directly.
 *
 * `identity` is resolved once at process startup (see identity.ts) and
 * closed over by every handler — there is no code path in this file that
 * accepts a userId from tool arguments.
 *
 * WRITE TOOLS: create_note is deliberately NOT exposed here. The web
 * agent (src/lib/agent/run-agent.ts) only ever *proposes* a note and
 * requires the human to click approve in the UI before POST /api/notes
 * actually runs (see src/lib/agent/agent-client.ts). This MCP server has
 * no equivalent server-enforced approval step over stdio — an MCP
 * client's own "confirm this tool call" UI is not something this server
 * controls or can rely on. Until either (a) a production HTTP transport
 * with real per-user auth exists, or (b) MCP elicitation is used to
 * require an explicit in-protocol confirmation before writing, exposing
 * create_note here would be a write with weaker guardrails than the web
 * app already has. Per the project's own rule — prefer read-only MCP
 * over insecure write access — it stays out. delete_note, raw SQL, and
 * any admin/filesystem/env-var access are out of scope entirely, not just
 * deferred.
 */

const SERVER_NAME = "mindvault";
const SERVER_VERSION = "0.1.0";

function jsonResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function toolError(message: string) {
  return { isError: true as const, content: [{ type: "text" as const, text: message }] };
}

// Internal error codes -> messages safe to hand an MCP client. No stack
// traces, no SQL, no provider/internal detail — same principle as the
// existing API routes' NOTE_SERVER_ERROR-style constants.
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  invalid_arguments: "The arguments provided did not pass validation.",
  search_unavailable: "Vault search is temporarily unavailable. Try again shortly.",
  not_found: "No note was found for that id.",
};

function safeMessageFor(code: string): string {
  return SAFE_ERROR_MESSAGES[code] ?? "The request could not be completed.";
}

export function createMindVaultMcpServer(identity: McpIdentity): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "search_vault",
    {
      title: "Search Vault",
      description:
        "Search the authenticated MindVault user's saved notes and return a bounded list of matches (id, title, a short content preview, type, category). Use 'semantic' mode (the default) to find notes by meaning even if the wording differs; use 'keyword' mode for an exact word or phrase. Only ever searches the authenticated user's own notes.",
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      inputSchema: {
        query: z.string().trim().min(1).max(500).describe("What to search for."),
        mode: z
          .enum(["semantic", "keyword"])
          .optional()
          .describe("Search mode. Defaults to semantic if omitted."),
      },
    },
    async ({ query, mode }) => {
      const startedAt = Date.now();
      const result = await executeSearchVault(identity.userId, { query, mode });
      logMcpToolCall({
        toolName: "search_vault",
        userId: identity.userId,
        startedAt,
        ok: result.ok,
        errorReason: result.ok ? undefined : result.error,
      });
      if (!result.ok) {
        return toolError(safeMessageFor(result.error));
      }
      return jsonResult({ notes: result.notes });
    },
  );

  server.registerTool(
    "get_note",
    {
      title: "Get Note",
      description:
        "Fetch the full content of one specific vault note by its id, scoped to the authenticated user. Only use a noteId that came from a previous search_vault or list_categories result — never guess one. A note that doesn't exist and a note owned by another user come back as the exact same 'not found' result.",
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      inputSchema: {
        noteId: z.string().trim().min(1).max(200).describe("The note's id, from a prior tool result."),
      },
    },
    async ({ noteId }) => {
      const startedAt = Date.now();
      const result = await executeGetNote(identity.userId, { noteId });
      logMcpToolCall({
        toolName: "get_note",
        userId: identity.userId,
        startedAt,
        ok: result.ok,
        errorReason: result.ok ? undefined : result.error,
      });
      if (!result.ok) {
        return toolError(safeMessageFor(result.error));
      }
      return jsonResult({ note: result.note });
    },
  );

  server.registerTool(
    "list_categories",
    {
      title: "List Categories",
      description:
        "List the authenticated user's vault categories (id, name, note count). There is no parameter to select a different owner — it always lists the connected identity's own categories.",
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      inputSchema: {},
    },
    async () => {
      const startedAt = Date.now();
      const result = await executeListCategories(identity.userId);
      logMcpToolCall({ toolName: "list_categories", userId: identity.userId, startedAt, ok: true });
      return jsonResult({ categories: result.categories });
    },
  );

  // RESOURCE vs TOOL: a tool is invoked with arguments to perform a
  // query/action; a resource is an addressable piece of context a client
  // can read (or attach to a prompt) without "calling" anything. This
  // exposes the same category data as list_categories, but as a fixed,
  // addressable URI — useful for a client that wants to attach "the
  // user's categories" as context up front, rather than issuing a tool
  // call mid-conversation.
  server.registerResource(
    "vault-categories",
    "mindvault://categories",
    {
      title: "Vault Categories",
      description: "The authenticated user's categories, as an addressable resource.",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = await executeListCategories(identity.userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result.categories, null, 2),
          },
        ],
      };
    },
  );

  // Resource template: mindvault://notes/{noteId} — fetch-by-known-id
  // only. `list: undefined` intentionally means this resource is never
  // enumerable: a client can read mindvault://notes/<id> if it already
  // has an id (from search_vault, say), but cannot ask "list every note
  // resource" and get the whole vault back as a directory. Same
  // ownership rule as get_note: another user's note id resolves to the
  // same not-found error, not a permission error.
  server.registerResource(
    "vault-note",
    new ResourceTemplate("mindvault://notes/{noteId}", { list: undefined }),
    {
      title: "Vault Note",
      description: "A single vault note by id, scoped to the authenticated user.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const rawNoteId = variables.noteId;
      const noteId = Array.isArray(rawNoteId) ? rawNoteId[0] : rawNoteId;
      const result = await executeGetNote(identity.userId, { noteId });
      if (!result.ok) {
        throw new Error(safeMessageFor(result.error));
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(result.note, null, 2),
          },
        ],
      };
    },
  );

  // PROMPT vs TOOL: a prompt is a reusable instruction template a client
  // can pull in — it returns text, not data, and touches nothing by
  // itself. This one only ever tells the receiving model to use the
  // tools above (still fully subject to the validation/ownership rules
  // enforced in tool-executors.ts) — it is not a second, looser way to
  // reach the vault.
  server.registerPrompt(
    "summarize_vault_topic",
    {
      title: "Summarize Vault Topic",
      description:
        "Reusable instructions for summarizing what the vault contains on a given topic, using search_vault and get_note.",
      argsSchema: { topic: z.string().trim().min(1).max(200) },
    },
    ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Use the search_vault tool (semantic mode) to find notes about "${topic}", then use get_note on the most relevant result(s) to read their full content. Write a concise summary of what the vault actually contains on this topic, grounded only in what those tools return. If nothing relevant turns up, say so plainly instead of guessing.`,
          },
        },
      ],
    }),
  );

  return server;
}

export const MCP_SERVER_NAME = SERVER_NAME;
export const MCP_SERVER_VERSION = SERVER_VERSION;
