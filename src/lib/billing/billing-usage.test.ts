import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { UsageEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { getUserEntitlements } from "./entitlements";
import { getUtcCalendarMonthPeriod } from "./period";
import { countAiRequestsInCurrentPeriod, recordAiUsage } from "./usage-metering";
import { ensureFreeSubscriptionForNewUser } from "./subscription-repository";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("billing usage integration", { skip: !runIntegration }, () => {
  let userA = "";
  let userB = "";

  before(async () => {
    const a = await prisma.user.create({
      data: {
        email: `billing-a-${Date.now()}@example.com`,
        passwordHash: "x",
        name: "Billing A",
      },
    });
    const b = await prisma.user.create({
      data: {
        email: `billing-b-${Date.now()}@example.com`,
        passwordHash: "x",
        name: "Billing B",
      },
    });
    userA = a.id;
    userB = b.id;
    await ensureFreeSubscriptionForNewUser(userA);
    await ensureFreeSubscriptionForNewUser(userB);
  });

  after(async () => {
    if (userA) await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    if (userB) await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("starts Free with zero AI usage", async () => {
    const ent = await getUserEntitlements(userA);
    assert.equal(ent.plan, "FREE");
    assert.equal(ent.aiRequests.used, 0);
    assert.equal(ent.aiRequests.limit, 50);
  });

  it("records analyze and chat separately for same user", async () => {
    await recordAiUsage(userA, UsageEventType.AI_ANALYZE);
    await recordAiUsage(userA, UsageEventType.AI_CHAT);
    const used = await countAiRequestsInCurrentPeriod(userA);
    assert.equal(used, 2);
  });

  it("does not cross-contaminate users", async () => {
    const usedB = await countAiRequestsInCurrentPeriod(userB);
    assert.equal(usedB, 0);
  });

  it("ignores usage events outside current UTC month", async () => {
    const { periodStart } = getUtcCalendarMonthPeriod();
    const prior = new Date(periodStart.getTime() - 86_400_000);
    await prisma.usageEvent.create({
      data: {
        userId: userB,
        type: UsageEventType.AI_CHAT,
        createdAt: prior,
      },
    });
    const used = await countAiRequestsInCurrentPeriod(userB);
    assert.equal(used, 0);
  });
});
