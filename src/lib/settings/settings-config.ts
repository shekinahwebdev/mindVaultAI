export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  href: string;
  external?: boolean;
};

export type SettingsSectionId =
  | "account"
  | "appearance"
  | "vault"
  | "ai"
  | "security"
  | "data"
  | "subscription"
  | "advanced";

export const SETTINGS_SECTIONS: SettingsNavItem[] = [
  { id: "account", label: "Account", href: "/vault/settings/account" },
  { id: "appearance", label: "Appearance", href: "/vault/settings/appearance" },
  { id: "vault", label: "Vault Preferences", href: "/vault/settings/vault" },
  { id: "ai", label: "AI & Search", href: "/vault/settings/ai" },
  { id: "security", label: "Privacy & Security", href: "/vault/settings/security" },
  { id: "data", label: "Data & Storage", href: "/vault/settings/data" },
  {
    id: "subscription",
    label: "Subscription & Billing",
    href: "/vault/subscription",
    external: true,
  },
  { id: "advanced", label: "Advanced", href: "/vault/settings/advanced" },
];

export const SETTINGS_DEFAULT_SECTION = "account" as const;

export const ACCOUNT_UPDATE_SUCCESS = "Account updated.";
export const PASSWORD_UPDATE_SUCCESS = "Password updated.";
export const PREFERENCES_UPDATE_SUCCESS = "Preferences saved.";
export const EXPORT_ERROR = "Could not export your vault. Please try again.";
export const DELETE_ACCOUNT_SUCCESS = "Account deleted.";
export const SETTINGS_LOAD_ERROR = "Could not load settings. Please try again.";
export const SETTINGS_SERVER_ERROR = "Something went wrong. Please try again.";
