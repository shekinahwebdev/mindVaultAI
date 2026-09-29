import { notFound } from "next/navigation";

import { SettingsIntegrationsSection } from "@/components/vault/settings/SettingsIntegrationsSection";
import { SettingsNotificationsSection } from "@/components/vault/settings/SettingsNotificationsSection";
import {
  AccountSettingsSection,
  AdvancedSettingsSection,
  AiSearchSettingsSection,
  AppearanceSettingsSection,
  DataStorageSection,
  PrivacySecuritySection,
  VaultPreferencesSection,
} from "@/components/vault/settings/SettingsSections";
import { SettingsSubscriptionSection } from "@/components/vault/settings/SettingsSubscriptionSection";
import { SETTINGS_SECTIONS } from "@/lib/settings/settings-config";

type VaultSettingsSectionPageProps = {
  params: Promise<{ section: string }>;
};

const SECTION_COMPONENTS = {
  account: AccountSettingsSection,
  appearance: AppearanceSettingsSection,
  vault: VaultPreferencesSection,
  ai: AiSearchSettingsSection,
  security: PrivacySecuritySection,
  data: DataStorageSection,
  subscription: SettingsSubscriptionSection,
  integrations: SettingsIntegrationsSection,
  notifications: SettingsNotificationsSection,
  advanced: AdvancedSettingsSection,
} as const;

const VALID_SECTIONS = new Set(
  SETTINGS_SECTIONS.filter((item) => !("external" in item && item.external)).map(
    (item) => item.id,
  ),
);

export default async function VaultSettingsSectionPage({
  params,
}: VaultSettingsSectionPageProps) {
  const { section } = await params;

  if (!VALID_SECTIONS.has(section as keyof typeof SECTION_COMPONENTS)) {
    notFound();
  }

  const Component =
    SECTION_COMPONENTS[section as keyof typeof SECTION_COMPONENTS];

  return <Component />;
}
