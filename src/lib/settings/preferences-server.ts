import { getOrCreateUserPreferences } from "./settings-queries";

export async function getUserPreferenceFlags(userId: string) {
  const preferences = await getOrCreateUserPreferences(userId);
  return {
    aiAssistanceEnabled: preferences.aiAssistanceEnabled,
    ragEnabled: preferences.ragEnabled,
    defaultSearchMode: preferences.defaultSearchMode,
  };
}
