export type HangingCardDefinition = {
  id: string;
  title: string;
  description: string;
  layout: "left" | "center" | "right";
};

export const hangingCards: readonly HangingCardDefinition[] = [
  {
    id: "save",
    title: "Save Anything",
    description: "Capture notes, links, ideas, code, and more.",
    layout: "left",
  },
  {
    id: "organise",
    title: "Organise Automatically",
    description: "AI-powered categories and tags.",
    layout: "center",
  },
  {
    id: "find",
    title: "Find Instantly",
    description: "Powerful semantic search across your knowledge.",
    layout: "right",
  },
];
