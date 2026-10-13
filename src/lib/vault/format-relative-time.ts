const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

/** UTC calendar day — stable across server (UTC) and client time zones. */
function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Stable label for SSR and the first client paint (matches relative fallback shape). */
export function formatRelativeTimeAnchor(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", SHORT_DATE_FORMAT).format(date);
}

/** Relative label for vault lists — falls back to short UTC date when older. */
export function formatRelativeTime(iso: string): string {
  const thenDate = new Date(iso);
  const then = thenDate.getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const now = new Date();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const todayKey = utcDayKey(now);
  const thenKey = utcDayKey(thenDate);

  if (thenKey === todayKey) {
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  }

  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (thenKey === utcDayKey(yesterday)) {
    return "Yesterday";
  }

  if (diffSec < 604800) {
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  return formatRelativeTimeAnchor(iso);
}
