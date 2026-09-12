import { Type, type FunctionDeclaration } from "@google/genai";

/**
 * The model only ever sees these four declarations — strict shapes, no
 * "run this code" escape hatch. Descriptions are written for the model,
 * not for us: they're the only thing steering when it decides to call a
 * given tool, so they say what the tool is for and what it returns.
 */

const searchVault: FunctionDeclaration = {
  name: "search_vault",
  description:
    "Search the user's saved vault notes and return a short list of matches (id, title, a content preview, type, category). Use 'semantic' mode (the default) to find notes by meaning even if the wording differs from the question; use 'keyword' mode when the user is looking for an exact word or phrase.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "What to search for." },
      mode: {
        type: Type.STRING,
        format: "enum",
        enum: ["semantic", "keyword"],
        description: "Search mode. Defaults to semantic if omitted.",
      },
    },
    required: ["query"],
  },
};

const getNote: FunctionDeclaration = {
  name: "get_note",
  description:
    "Fetch the full content of one specific vault note by its id. Only use this with a noteId that came from a previous search_vault or list_categories result in this same conversation — never guess an id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      noteId: { type: Type.STRING, description: "The note's id, from a prior tool result." },
    },
    required: ["noteId"],
  },
};

const listCategories: FunctionDeclaration = {
  name: "list_categories",
  description: "List the user's vault categories (id, name, and how many notes are in each).",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const createNote: FunctionDeclaration = {
  name: "create_note",
  description:
    "Propose creating a new vault note. This does NOT save anything by itself — it only prepares a proposal that the user must explicitly approve before anything is written. Use this when the user asks you to save, remember, or note something down.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A short, concise title for the note." },
      content: { type: Type.STRING, description: "The note's content." },
      type: {
        type: Type.STRING,
        format: "enum",
        enum: ["NOTE", "LINK", "QUOTE", "CODE", "ARTICLE", "OTHER"],
        description: "The note type. Defaults to NOTE if omitted.",
      },
      categoryName: {
        type: Type.STRING,
        description:
          "Name of an existing category this note fits best, if any (call list_categories first if unsure). Omit if none fits — never invent a new category name.",
      },
      sourceUrl: { type: Type.STRING, description: "An optional source URL." },
    },
    required: ["title", "content"],
  },
};

export const AGENT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  searchVault,
  getNote,
  listCategories,
  createNote,
];
