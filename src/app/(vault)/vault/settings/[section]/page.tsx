import { notFound } from "next/navigation";

import {
  AccountSettingsSection,
  AdvancedSettingsSection,
  AiSearchSettingsSection,
  AppearanceSettingsSection,
  DataStorageSection,
  PrivacySecuritySection,
  VaultPreferencesSection,
} from "@/components/vault/settings/SettingsSections";
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
