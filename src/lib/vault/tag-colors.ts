const TAG_COLOR_PALETTE = [
  "#3B82F6",
  "#22C55E",
  "#EC4899",
  "#A855F7",
  "#F59E0B",
  "#14B8A6",
  "#6366F1",
  "#EF4444",
] as const;

function hashTagName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTagColor(name: string): string {
  const index = hashTagName(name.trim().toLowerCase()) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index] ?? TAG_COLOR_PALETTE[0];
}
