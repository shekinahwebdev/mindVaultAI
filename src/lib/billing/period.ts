/** Calendar-month AI usage window in UTC (Free tier). Paid periods may later use provider renewal dates. */
export function getUtcCalendarMonthPeriod(reference = new Date()): {
  periodStart: Date;
  periodEnd: Date;
  periodKey: string;
} {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { periodStart, periodEnd, periodKey };
}
