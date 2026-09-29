"use client";

const STORAGE_KEY = "mindvault-settings-ui-v1";

export type AccentColorId =
  | "blue"
  | "purple"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "pink";

export type InterfaceDensity = "comfortable" | "compact" | "minimal";
export type TypographyFont = "inter" | "geist" | "system";

export type SettingsUiPrefs = {
  accentColor: AccentColorId;
  interfaceDensity: InterfaceDensity;
  typographyFont: TypographyFont;
  showBacklinks: boolean;
  showWordCount: boolean;
  richTextEditor: boolean;
  defaultVaultView: "list" | "grid";
  groupNotesBy: "none" | "category" | "type";
  rememberLastCategory: boolean;
  showSourceReferences: boolean;
  preferredAiModel: string;
  searchScope: "all" | "notes" | "links";
  searchIncludeCode: boolean;
  searchAiSuggestions: boolean;
  dataUsageForAi: boolean;
  analyticsEnabled: boolean;
  personalizedRecommendations: boolean;
  autoBackup: boolean;
  notifyMentions: boolean;
  notifyShared: boolean;
  notifyAiResponses: boolean;
  notifyProductUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailAiSummary: boolean;
  emailSecurityAlerts: boolean;
  experimentalBetaFeatures: boolean;
};

export const DEFAULT_SETTINGS_UI_PREFS: SettingsUiPrefs = {
  accentColor: "blue",
  interfaceDensity: "comfortable",
  typographyFont: "inter",
  showBacklinks: true,
  showWordCount: true,
  richTextEditor: true,
  defaultVaultView: "list",
  groupNotesBy: "category",
  rememberLastCategory: true,
  showSourceReferences: true,
  preferredAiModel: "auto",
  searchScope: "all",
  searchIncludeCode: true,
  searchAiSuggestions: true,
  dataUsageForAi: true,
  analyticsEnabled: false,
  personalizedRecommendations: false,
  autoBackup: false,
  notifyMentions: true,
  notifyShared: true,
  notifyAiResponses: true,
  notifyProductUpdates: false,
  emailWeeklyDigest: true,
  emailAiSummary: false,
  emailSecurityAlerts: true,
  experimentalBetaFeatures: false,
};

export const ACCENT_COLOR_SWATCHES: Array<{
  id: AccentColorId;
  label: string;
  hex: string;
}> = [
  { id: "blue", label: "Blue", hex: "#3B82F6" },
  { id: "purple", label: "Purple", hex: "#A855F7" },
  { id: "red", label: "Red", hex: "#EF4444" },
  { id: "orange", label: "Orange", hex: "#F97316" },
  { id: "yellow", label: "Yellow", hex: "#EAB308" },
  { id: "green", label: "Green", hex: "#22C55E" },
  { id: "pink", label: "Pink", hex: "#EC4899" },
];

export function readSettingsUiPrefs(): SettingsUiPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS_UI_PREFS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS_UI_PREFS;
    return { ...DEFAULT_SETTINGS_UI_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS_UI_PREFS;
  }
}

export function writeSettingsUiPrefs(prefs: SettingsUiPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
