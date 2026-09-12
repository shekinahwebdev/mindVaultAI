import type { NoteType } from "@/generated/prisma/enums";

/**
 * Provider-independent agent types. As with src/lib/ai/types.ts and
 * src/lib/rag/types.ts, nothing Gemini-specific (FunctionCall,
 * thoughtSignature, etc.) should leak past run-agent.ts.
 */

export const READ_TOOL_NAMES = ["search_vault", "get_note", "list_categories"] as const;
export const WRITE_TOOL_NAMES = ["create_note"] as const;
export type ReadToolName = (typeof READ_TOOL_NAMES)[number];
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];
export type ToolName = ReadToolName | WriteToolName;

// One step of the observable trace shown in the UI's optional dev panel
// — never raw model reasoning, only what actually ran.
export type AgentTraceStep = {
  tool: ToolName;
  summary: string;
};

export type AgentRunResult =
  | {
      type: "answer";
      message: string;
      trace: AgentTraceStep[];
    }
  | {
      type: "pending_action";
      tool: "create_note";
      message: string;
      action: {
        title: string;
        content: string;
        type: NoteType;
        sourceUrl: string | null;
        categoryId: string | null;
        categoryName: string | null;
      };
      trace: AgentTraceStep[];
    }
  | {
      type: "error";
      reason: "invalid_message" | "unavailable" | "too_many_steps";
    };
