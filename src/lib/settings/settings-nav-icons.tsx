import {
  Bell,
  CreditCard,
  Database,
  HardDrive,
  Link2,
  Palette,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import type { SettingsSectionId } from "./settings-config";

export const SETTINGS_NAV_ICONS: Record<SettingsSectionId, LucideIcon> = {
  account: User,
  appearance: Palette,
  vault: Database,
  ai: Sparkles,
  security: Shield,
  data: HardDrive,
  subscription: CreditCard,
  integrations: Link2,
  notifications: Bell,
  advanced: SlidersHorizontal,
};
