export const magicPasteText =
  "Understanding RAG involves retrieving relevant information before generating an answer…";

export const magicResult = {
  title: "Understanding RAG",
  category: "AI & Machine Learning",
  type: "Article",
  tags: ["RAG", "Retrieval", "LLM"],
} as const;

export const magicSteps = [
  { id: "paste", label: "Paste" },
  { id: "analyze", label: "Analyze" },
  { id: "understand", label: "Understand" },
  { id: "organize", label: "Organize" },
] as const;

export type MagicStage = (typeof magicSteps)[number]["id"];

export const magicTimings = {
  heading: 0.12,
  supporting: 0.38,
  box: 0.7,
  paste: 0.85,
  analyze: 2.55,
  understand: 3.75,
  organize: 4.7,
  understood: 5.25,
  next: 5.75,
} as const;
