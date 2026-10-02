import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AvatarType } from "@/generated/prisma/enums";

import { parseUpdateAvatarBody } from "./avatar-validation";

describe("parseUpdateAvatarBody", () => {
  it("accepts reset to initials", () => {
    const result = parseUpdateAvatarBody({ avatarType: AvatarType.INITIALS });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.avatarType, AvatarType.INITIALS);
  });

  it("accepts validated emoji avatar", () => {
    const result = parseUpdateAvatarBody({
      avatarType: AvatarType.EMOJI,
      avatarEmoji: "🧠",
      avatarBackground: "purple",
    });
    assert.equal(result.success, true);
  });

  it("rejects unknown emoji", () => {
    const result = parseUpdateAvatarBody({
      avatarType: AvatarType.EMOJI,
      avatarEmoji: "🦄",
      avatarBackground: "purple",
    });
    assert.equal(result.success, false);
  });

  it("rejects arbitrary background key", () => {
    const result = parseUpdateAvatarBody({
      avatarType: AvatarType.EMOJI,
      avatarEmoji: "🚀",
      avatarBackground: "#ff00ff",
    });
    assert.equal(result.success, false);
  });
});
