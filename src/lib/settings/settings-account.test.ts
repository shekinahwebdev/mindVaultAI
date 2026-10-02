import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/db";

import { getSettingsBundle, updateAccountProfile } from "./settings-queries";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("updateAccountProfile ownership", { skip: !runIntegration }, () => {
  let userA = "";
  let userB = "";

  before(async () => {
    const a = await prisma.user.create({
      data: {
        email: `bio-a-${Date.now()}@example.com`,
        passwordHash: "x",
        name: "User A",
      },
    });
    const b = await prisma.user.create({
      data: {
        email: `bio-b-${Date.now()}@example.com`,
        passwordHash: "x",
        name: "User B",
      },
    });
    userA = a.id;
    userB = b.id;
  });

  after(async () => {
    if (userA) await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    if (userB) await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("persists bio for the targeted user only", async () => {
    await updateAccountProfile(userA, {
      name: "User A",
      bio: "AI engineer in training. Building MindVault.",
    });

    const bundleA = await getSettingsBundle(userA);
    const bundleB = await getSettingsBundle(userB);

    assert.equal(bundleA.account.bio, "AI engineer in training. Building MindVault.");
    assert.equal(bundleB.account.bio, null);
  });

  it("clears bio when saved empty", async () => {
    await updateAccountProfile(userA, { name: "User A", bio: null });
    const bundle = await getSettingsBundle(userA);
    assert.equal(bundle.account.bio, null);
  });
});
