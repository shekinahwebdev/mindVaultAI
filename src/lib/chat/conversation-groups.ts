export type ConversationDateGroup = "today" | "yesterday" | "earlier";

export const CONVERSATION_GROUP_LABELS: Record<ConversationDateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

export function conversationDateGroup(updatedAtIso: string, now = new Date()): ConversationDateGroup {
  const updated = new Date(updatedAtIso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (updated >= startOfToday) {
    return "today";
  }
  if (updated >= startOfYesterday) {
    return "yesterday";
  }
  return "earlier";
}

export function groupConversationsByDate<T extends { updatedAt: string }>(
  items: T[],
): Record<ConversationDateGroup, T[]> {
  const groups: Record<ConversationDateGroup, T[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const item of items) {
    groups[conversationDateGroup(item.updatedAt)].push(item);
  }

  return groups;
}
