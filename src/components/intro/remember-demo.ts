export const rememberQuery = "What did I save about AWS IAM roles?";

export const rememberAnswer = "You saved 6 resources about IAM.";

export const rememberSources = [
  { source: "Article", title: "IAM roles explained" },
  { source: "ChatGPT", title: "AssumeRole walkthrough" },
  { source: "Notes", title: "Production access notes" },
] as const;

export const rememberTimings = {
  heading: 0.12,
  supporting: 0.38,
  box: 0.7,
  query: 0.9,
  searching: 2.35,
  answer: 3.05,
  cards: 3.45,
  home: 4.55,
  actions: 5.15,
} as const;
