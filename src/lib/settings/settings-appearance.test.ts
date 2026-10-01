import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ThemeMode } from "@/generated/prisma/enums";

import { parseUpdatePreferencesBody } from "./settings-validation";

describe("parseUpdatePreferencesBody appearance", () => {
  it("accepts partial accent update without resetting theme", () => {
    const result = parseUpdatePreferencesBody({ accentColor: "purple" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.accentColor, "PURPLE");
    assert.equal(result.data.theme, undefined);
  });

  it("rejects invalid accent color", () => {
    const result = parseUpdatePreferencesBody({ accentColor: "javascript:alert(1)" });
    assert.equal(result.success, false);
  });

  it("rejects invalid density", () => {
    const result = parseUpdatePreferencesBody({ interfaceDensity: "ultra" });
    assert.equal(result.success, false);
  });

  it("rejects invalid font", () => {
    const result = parseUpdatePreferencesBody({ fontFamily: "Comic Sans" });
    assert.equal(result.success, false);
  });

  it("accepts theme system mode", () => {
    const result = parseUpdatePreferencesBody({ theme: ThemeMode.SYSTEM });
    assert.equal(result.success, true);
  });
});
