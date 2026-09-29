"use client";

import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

import {
  SettingsPanel,
  SettingsPanelHint,
  settingsPanelSurfaceClassName,
} from "./settings-ui";

const INTEGRATIONS = [
  {
    id: "gdrive",
    name: "Google Drive",
    description: "Import docs and attachments from Drive.",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync pages and databases into your vault.",
    connected: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Save snippets and link repositories.",
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Capture messages and threads.",
    connected: false,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Archive watch-later and transcripts.",
    connected: false,
  },
  {
    id: "figma",
    name: "Figma",
    description: "Store design links and comments.",
    connected: false,
  },
] as const;

export function SettingsIntegrationsSection() {
  return (
    <SettingsPanel
      title="Integrations"
      description="Connect MindVault with your favorite tools."
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <li key={item.id}>
            <article
              className={cn(
                settingsPanelSurfaceClassName,
                "flex h-full flex-col border-border/80 px-4 py-4 shadow-none",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[0.9375rem] font-semibold text-foreground">{item.name}</h3>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                {item.connected ? (
                  <span className="shrink-0 rounded-full border border-border bg-mv-panel px-2 py-0.5 text-[0.6875rem] font-medium text-foreground">
                    Connected
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className={cn(
                  item.connected ? vaultSecondaryButton : vaultPrimaryButton,
                  "mt-4 w-full",
                )}
              >
                {item.connected ? "Manage" : "Connect"}
              </button>
            </article>
          </li>
        ))}
      </ul>
      <SettingsPanelHint>
        OAuth connections are preview-only. No third-party accounts are linked yet.
      </SettingsPanelHint>
    </SettingsPanel>
  );
}
