import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isLikelyGroundedFollowUp } from "./grounded-follow-up";

describe("isLikelyGroundedFollowUp", () => {
  const trueish = [
    "Explain that more simply.",
    "Summarize this.",
    "What about the second point?",
    "Why is that important?",
    "Can you summarize that?",
    "Make that shorter.",
    "Summarize that in 3 bullets.",
    "What did you mean by the second point?",
  ];

  for (const question of trueish) {
    it(`accepts follow-up: ${question}`, () => {
      assert.equal(isLikelyGroundedFollowUp(question), true);
    });
  }

  const falseish = [
    "What is your name?",
    "Tell me about AWS.",
    "Write a poem.",
    "How do I deploy NestJS?",
    "Who invented Python?",
  ];

  for (const question of falseish) {
    it(`rejects non-follow-up: ${question}`, () => {
      assert.equal(isLikelyGroundedFollowUp(question), false);
    });
  }
});
