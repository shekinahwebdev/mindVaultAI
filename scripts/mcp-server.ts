/**
 * MindVault MCP server entrypoint (stdio transport).
 *
 * Usage:
 *   npm run mcp
 *
 * This is a separate process from `next dev` / `next start` — it does
 * NOT serve the web app, and the web app does not need to be running for
 * this to work (it talks to Postgres directly, same as
 * embeddings:backfill does). It exposes a read-only slice of MindVault
 * (search_vault, get_note, list_categories, two resources, and one
 * prompt — see src/lib/mcp/server.ts) to any MCP-compatible client over
 * stdio: the MCP Inspector, an MCP-enabled AI assistant, etc.
 *
 * Requires MCP_DEV_USER_EMAIL in .env — see src/lib/mcp/identity.ts and
 * docs/mcp.md for what that does and why.
 */
import "dotenv/config";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { resolveDevIdentity } from "@/lib/mcp/identity";
import { createMindVaultMcpServer } from "@/lib/mcp/server";

async function main() {
  const identity = await resolveDevIdentity();
  const server = createMindVaultMcpServer(identity);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the JSON-RPC wire for the stdio transport — every log line
  // must go to stderr (console.error), never stdout/console.log, or it
  // corrupts the protocol stream from the client's point of view.
  console.error(`[mcp] MindVault MCP server ready — acting as ${identity.email} (dev identity).`);
}

main().catch((error) => {
  console.error("[mcp] failed to start:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
