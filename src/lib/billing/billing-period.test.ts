import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getUtcCalendarMonthPeriod } from "./period";

describe("getUtcCalendarMonthPeriod", () => {
  it("uses UTC calendar month boundaries", () => {
    const ref = new Date("2026-09-15T12:00:00.000Z");
    const { periodStart, periodEnd, periodKey } = getUtcCalendarMonthPeriod(ref);
    assert.equal(periodKey, "2026-09");
    assert.equal(periodStart.toISOString(), "2026-09-01T00:00:00.000Z");
    assert.equal(periodEnd.toISOString(), "2026-10-01T00:00:00.000Z");
  });

  it("excludes events from previous month", () => {
    const ref = new Date("2026-10-01T00:00:00.000Z");
    const { periodStart } = getUtcCalendarMonthPeriod(ref);
    assert.equal(periodStart.toISOString(), "2026-10-01T00:00:00.000Z");
  });
});
