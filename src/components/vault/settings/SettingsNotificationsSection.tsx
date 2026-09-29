"use client";

import { useSettingsUiPrefs } from "@/lib/settings/use-settings-ui-prefs";

import {
  SettingsPanel,
  SettingsPanelHint,
  SettingsSubsection,
  SettingsToggleRow,
} from "./settings-ui";

export function SettingsNotificationsSection() {
  const { prefs, setPrefs, ready } = useSettingsUiPrefs();

  if (!ready) {
    return null;
  }

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose how and when MindVault reaches you."
    >
      <SettingsSubsection title="In-app notifications">
        <div className="space-y-2">
          <SettingsToggleRow
            label="Mentions"
            description="When someone references you in shared content."
            checked={prefs.notifyMentions}
            onChange={(checked) => setPrefs({ notifyMentions: checked })}
          />
          <SettingsToggleRow
            label="Shared content"
            description="Updates on notes shared with you."
            checked={prefs.notifyShared}
            onChange={(checked) => setPrefs({ notifyShared: checked })}
          />
          <SettingsToggleRow
            label="AI responses"
            description="When Ask MindVault finishes a long response."
            checked={prefs.notifyAiResponses}
            onChange={(checked) => setPrefs({ notifyAiResponses: checked })}
          />
          <SettingsToggleRow
            label="Product updates"
            description="New features and improvements."
            checked={prefs.notifyProductUpdates}
            onChange={(checked) => setPrefs({ notifyProductUpdates: checked })}
          />
        </div>
      </SettingsSubsection>

      <SettingsSubsection title="Email notifications">
        <div className="space-y-2">
          <SettingsToggleRow
            label="Weekly digest"
            description="Summary of activity in your vault."
            checked={prefs.emailWeeklyDigest}
            onChange={(checked) => setPrefs({ emailWeeklyDigest: checked })}
          />
          <SettingsToggleRow
            label="AI summary"
            description="Optional recap of AI-assisted organization."
            checked={prefs.emailAiSummary}
            onChange={(checked) => setPrefs({ emailAiSummary: checked })}
          />
          <SettingsToggleRow
            label="Security alerts"
            description="Sign-in and password changes."
            checked={prefs.emailSecurityAlerts}
            onChange={(checked) => setPrefs({ emailSecurityAlerts: checked })}
          />
        </div>
      </SettingsSubsection>

      <SettingsPanelHint>
        Preferences save on this device until email and push delivery are enabled.
      </SettingsPanelHint>
    </SettingsPanel>
  );
}
