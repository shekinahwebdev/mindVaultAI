import { redirect } from "next/navigation";

import { SETTINGS_DEFAULT_SECTION } from "@/lib/settings/settings-config";

export default function VaultSettingsIndexPage() {
  redirect(`/vault/settings/${SETTINGS_DEFAULT_SECTION}`);
}
