import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/db";

import { getSettingsBundle, updateUserPreferences } from "./settings-queries";
import { accentColorToPrisma, interfaceDensityToPrisma, uiFontToPrisma } from "./appearance-prefs";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("appearance preferences persistence", { skip: !runIntegration }, () => {
  let userId = "";

  before(async () => {
    const user = await prisma.user.create({
      data: {
        email: `appearance-${Date.now()}@example.com`,
        passwordHash: "x",
        name: "Appearance Test",
      },
    });
    userId = user.id;
  });

  after(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("persists accent without changing reduced motion", async () => {
    const before = await getSettingsBundle(userId);
    await updateUserPreferences(userId, {
      accentColor: accentColorToPrisma("purple"),
    });

    const after = await getSettingsBundle(userId);
    assert.equal(after.preferences.accentColor, "purple");
    assert.equal(after.preferences.reducedMotion, before.preferences.reducedMotion);
  });

  it("persists density and font", async () => {
    await updateUserPreferences(userId, {
      interfaceDensity: interfaceDensityToPrisma("compact"),
      fontFamily: uiFontToPrisma("inter"),
    });

    const bundle = await getSettingsBundle(userId);
    assert.equal(bundle.preferences.interfaceDensity, "compact");
    assert.equal(bundle.preferences.fontFamily, "inter");
  });
});
