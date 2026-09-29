/** Relative label for vault lists — falls back to short date when older. */
export function formatRelativeTime(iso: string): string {
  const thenDate = new Date(iso);
  const then = thenDate.getTime();
  if (Number.isNaN(then)) return "";

  const now = new Date();
  const diffSec = Math.round((Date.now() - then) / 1000);

  if (thenDate.toDateString() === now.toDateString()) {
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (thenDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (diffSec < 604800) {
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(thenDate);
}
