import { prisma } from "@/lib/db";

export type McpIdentity = {
  userId: string;
  email: string;
};

/**
 * Development-only identity resolution for the MCP server.
 *
 * The web app identifies a request's user via the signed session cookie
 * (see src/lib/auth/session.ts). The MCP server is a separate local
 * process talking over stdio — it never sees a browser cookie, so it
 * needs its own way to answer "which MindVault user is this?"
 *
 * The rule here is deliberately narrow: the operator starting the server
 * names exactly one existing account via MCP_DEV_USER_EMAIL in their own
 * .env, we look that user up, and every tool call for the lifetime of
 * this process acts as that user and no other. No tool input parameter
 * can select or override it — there is no "userId" argument anywhere in
 * the MCP tool schemas (see src/lib/mcp/server.ts), so a connecting MCP
 * client has no way to ask for a different user's data.
 *
 * This is NOT production authentication. It does not verify a password,
 * issue or check a token, or support more than one identity per running
 * server. A production-ready transport (see docs/mcp.md) would carry a
 * real per-request credential — e.g. an authenticated HTTP transport
 * that maps a bearer token to a MindVault session the same way
 * requireApiSession() does for the web API today — resolved fresh on
 * every call instead of once at process startup.
 */
export async function resolveDevIdentity(): Promise<McpIdentity> {
  const email = process.env.MCP_DEV_USER_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "MCP_DEV_USER_EMAIL is not set. The MindVault MCP server needs to know which existing local account it acts as — set MCP_DEV_USER_EMAIL in .env to that account's email. See docs/mcp.md.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(
      `MCP_DEV_USER_EMAIL is set to "${email}" but no MindVault user with that email exists. Sign up in the app first, then point MCP_DEV_USER_EMAIL at that account's email.`,
    );
  }

  return { userId: user.id, email: user.email };
}
