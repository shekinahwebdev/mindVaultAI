"use client";

import { KeyRound, Lock, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { VaultLogoutAction } from "@/components/vault/VaultLogoutAction";
import { useCategories } from "@/lib/categories/use-categories";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import { formatNoteDate } from "@/lib/notes/note-display";
import { routes, vaultRoutes } from "@/lib/routes";
import {
  ACCOUNT_UPDATE_SUCCESS,
  PASSWORD_UPDATE_SUCCESS,
  PREFERENCES_UPDATE_SUCCESS,
  SETTINGS_LOAD_ERROR,
  SETTINGS_SERVER_ERROR,
} from "@/lib/settings/settings-config";
import {
  changePasswordRequest,
  deleteAccountRequest,
  exportVaultDownloadUrl,
  fetchEmbeddingsStatus,
  rebuildEmbeddingsRequest,
  updateAccountRequest,
  updatePreferencesRequest,
} from "@/lib/settings/settings-client";
import type { SerializedPreferences } from "@/lib/settings/settings-queries";
import { usePreferences } from "@/lib/settings/preferences-context";
import { useSettingsUiPrefs } from "@/lib/settings/use-settings-ui-prefs";
import { useSettingsData } from "@/components/vault/settings/use-settings-data";
import { getVaultInitials } from "@/lib/vault/user-display";
import { useVaultSession } from "@/components/vault/VaultSessionProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { toastError, toastInfo, toastSuccess } from "@/lib/vault-toast";
import {
  prismaThemeToPreference,
  preferenceToPrismaTheme,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

import {
  vaultActionShape,
  vaultDestructiveButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import {
  SettingsAccentSwatches,
  SettingsActionRow,
  SettingsAvatarRow,
  SettingsDangerPanel,
  SettingsField,
  SettingsFormFooter,
  SettingsInlineCard,
  SettingsMetadataRow,
  SettingsPanel,
  SettingsPanelHint,
  SettingsReadOnlyValue,
  SettingsSectionLoading,
  SettingsSegmented,
  SettingsStatus,
  SettingsSubsection,
  SettingsToggleRow,
  settingsFormStackClassName,
  settingsInputClassName,
  settingsProgressTrackClassName,
  settingsSelectClassName,
  settingsTextareaClassName,
} from "./settings-ui";

export function AccountSettingsSection() {
  const router = useRouter();
  const session = useVaultSession();
  const { data, loading, error, reload } = useSettingsData();
  const { refreshPreferences } = usePreferences();
  const seedName = data?.account.name ?? session.name ?? "";
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? seedName;
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || submittingRef.current) return;

    submittingRef.current = true;
    setSaving(true);
    setFieldError("");
    setFormError("");

    const { data: response } = await updateAccountRequest(name.trim());

    if (response?.ok) {
      toastSuccess(ACCOUNT_UPDATE_SUCCESS);
      setNameDraft(null);
      await reload();
      await refreshPreferences();
      router.refresh();
    } else if (response && !response.ok && response.errors?.name) {
      setFieldError(response.errors.name);
    } else {
      toastError(response?.message || SETTINGS_SERVER_ERROR);
    }

    submittingRef.current = false;
    setSaving(false);
  }

  if (loading) {
    return <SettingsSectionLoading message="Loading account…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  const initials = getVaultInitials({
    userId: data.account.id,
    email: data.account.email,
    name: data.account.name,
  });

  const trimmedName = name.trim();
  const savedName = (data.account.name ?? "").trim();
  const isDirty = trimmedName !== savedName;
  const saveDisabled = saving || !isDirty || trimmedName.length === 0;

  return (
    <SettingsPanel
      title="Account"
      description="Manage your profile information and account settings."
      actions={
        <button
          type="submit"
          form="account-settings-form"
          disabled={saveDisabled}
          className={cn(vaultPrimaryButton, saveDisabled && "opacity-50")}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      }
    >
      <form
        id="account-settings-form"
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <SettingsSubsection title="Profile Information">
          <SettingsAvatarRow initials={initials} onChangePhotoDisabled />

          <div className={settingsFormStackClassName}>
            <SettingsField id="account-name" label="Full Name" error={fieldError}>
              <input
                id="account-name"
                value={name}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  setFieldError("");
                }}
                disabled={saving}
                className={settingsInputClassName}
                autoComplete="name"
              />
            </SettingsField>

            <SettingsReadOnlyValue
              label="Email Address"
              value={data.account.email}
            />

            <SettingsField
              id="account-bio"
              label="Bio (Optional)"
              hint="Profile bios are not saved yet."
            >
              <textarea
                id="account-bio"
                disabled
                placeholder="Tell us a little about yourself..."
                className={settingsTextareaClassName}
              />
            </SettingsField>
          </div>

          <SettingsMetadataRow
            label="Member since"
            value={formatNoteDate(data.account.createdAt)}
          />
        </SettingsSubsection>

        {formError ? <SettingsStatus message={formError} tone="error" /> : null}
      </form>

      <SettingsSubsection title="Account Actions" className="border-t border-border pt-6">
        <div className="space-y-2">
          <SettingsActionRow
            href={`${vaultRoutes.settings}/security`}
            icon={Lock}
            title="Change Password"
            description="Update your password and keep your vault secure."
          />
          <SettingsActionRow
            href={`${vaultRoutes.settings}/security`}
            icon={Mail}
            title="Manage Email"
            description="Email is tied to sign-in. Contact support to change it."
          />
          <SettingsActionRow
            href={`${vaultRoutes.settings}/advanced`}
            icon={Trash2}
            title="Delete Account"
            description="Permanently remove your account and all vault data."
            tone="danger"
          />
        </div>
      </SettingsSubsection>
    </SettingsPanel>
  );
}

export function AppearanceSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const { preference, setPreference } = useTheme();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();
  const [saving, setSaving] = useState(false);

  async function saveAppearance(
    patch: Partial<SerializedPreferences>,
    nextTheme?: ThemePreference,
  ) {
    if (nextTheme) {
      setPreference(nextTheme);
    }

    setSaving(true);

    const { data: response } = await updatePreferencesRequest({
      ...patch,
      ...(nextTheme ? { theme: preferenceToPrismaTheme(nextTheme) } : {}),
    });

    if (response?.ok) {
      setPreferences(response.preferences);
      toastSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      toastError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <SettingsSectionLoading message="Loading appearance…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  const currentTheme = prismaThemeToPreference(data.preferences.theme);
  const selectedTheme = preference || currentTheme;

  const themeOptions: Array<{
    value: ThemePreference;
    label: string;
    description: string;
  }> = [
    {
      value: "light",
      label: "Light",
      description: "Clean neutral surfaces for daytime reading.",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Near-black workspace with charcoal panels.",
    },
    {
      value: "system",
      label: "System",
      description: "Follow your operating system preference.",
    },
  ];

  if (!uiReady) {
    return <SettingsSectionLoading message="Loading appearance…" />;
  }

  return (
    <SettingsPanel
      title="Appearance"
      description="Customize how MindVault looks and feels."
    >
      <SettingsSubsection title="Theme">
        <div className="grid gap-2 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const active = selectedTheme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={saving}
                onClick={() => void saveAppearance({}, option.value)}
                className={cn(
                  "rounded-[var(--mv-radius-control)] border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-primary/25 bg-surface"
                    : "border-border bg-mv-panel hover:border-foreground/20",
                  saving && "opacity-70",
                )}
              >
                <span className="block text-[0.84rem] font-medium text-foreground">
                  {option.label}
                </span>
                <span className="mt-1 block text-[0.72rem] leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSubsection>

      <SettingsSubsection title="Accent color">
        <SettingsAccentSwatches
          value={prefs.accentColor}
          onChange={(id) =>
            setPrefs({ accentColor: id as typeof prefs.accentColor })
          }
        />
        <SettingsPanelHint>Accent color applies to preview UI on this device.</SettingsPanelHint>
      </SettingsSubsection>

      <SettingsSubsection title="Interface density">
        <SettingsSegmented
          value={prefs.interfaceDensity}
          onChange={(value) => setPrefs({ interfaceDensity: value })}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
            { value: "minimal", label: "Minimal" },
          ]}
        />
      </SettingsSubsection>

      <SettingsSubsection title="Typography">
        <SettingsField id="settings-font" label="Font">
          <select
            id="settings-font"
            value={prefs.typographyFont}
            onChange={(event) =>
              setPrefs({
                typographyFont: event.target.value as typeof prefs.typographyFont,
              })
            }
            className={settingsSelectClassName}
          >
            <option value="inter">Inter (Default)</option>
            <option value="geist">Geist</option>
            <option value="system">System UI</option>
          </select>
        </SettingsField>
        <p className="rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 px-3 py-2.5 text-[0.875rem] text-foreground">
          The quick brown fox jumps over the lazy dog.
        </p>
      </SettingsSubsection>

      <SettingsToggleRow
        label="Reduced motion"
        description="Minimize non-essential animations across the vault."
        checked={data.preferences.reducedMotion}
        onChange={(checked) => void saveAppearance({ reducedMotion: checked })}
        disabled={saving}
      />
    </SettingsPanel>
  );
}

export function VaultPreferencesSection() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePreferences(patch: Partial<SerializedPreferences>) {
    setSaving(true);
    setFormError("");

    const { data: response } = await updatePreferencesRequest(patch);

    if (response?.ok) {
      setPreferences(response.preferences);
      toastSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      toastError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <SettingsSectionLoading message="Loading preferences…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  if (!uiReady) {
    return <SettingsSectionLoading message="Loading preferences…" />;
  }

  return (
    <SettingsPanel
      title="Vault Preferences"
      description="Set default behaviors for your notes, organization and content."
    >
      <SettingsSubsection title="Default note settings">
        <div className={settingsFormStackClassName}>
          <SettingsField id="default-type" label="Default note type">
            <select
              id="default-type"
              value={data.preferences.defaultNoteType}
              disabled={saving}
              onChange={(event) =>
                void savePreferences({ defaultNoteType: event.target.value })
              }
              className={settingsSelectClassName}
            >
              {captureNoteTypeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-surface text-foreground"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField id="default-category" label="Default category">
            <select
              id="default-category"
              value={data.preferences.defaultCategoryId ?? ""}
              disabled={saving || categoriesLoading}
              onChange={(event) =>
                void savePreferences({
                  defaultCategoryId: event.target.value || null,
                })
              }
              className={settingsSelectClassName}
            >
              <option value="" className="bg-surface text-foreground">
                None / Uncategorized
              </option>
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  className="bg-surface text-foreground"
                >
                  {category.name}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField id="default-tags" label="Default tags" hint="Tagging on notes is coming soon.">
            <input
              id="default-tags"
              disabled
              placeholder="work, ideas"
              className={settingsInputClassName}
            />
          </SettingsField>
        </div>

        <div className="space-y-2">
          <SettingsToggleRow
            label="Show backlinks"
            description="Surface linked notes in the note detail view."
            checked={prefs.showBacklinks}
            onChange={(checked) => setPrefs({ showBacklinks: checked })}
          />
          <SettingsToggleRow
            label="Show word count"
            description="Display word count while editing."
            checked={prefs.showWordCount}
            onChange={(checked) => setPrefs({ showWordCount: checked })}
          />
          <SettingsToggleRow
            label="Enable rich text editor"
            description="Formatting toolbar in capture and notes."
            checked={prefs.richTextEditor}
            onChange={(checked) => setPrefs({ richTextEditor: checked })}
          />
        </div>
      </SettingsSubsection>

      <SettingsSubsection title="Organization">
        <SettingsField id="default-view" label="Default view">
          <SettingsSegmented
            value={prefs.defaultVaultView}
            onChange={(value) => setPrefs({ defaultVaultView: value })}
            options={[
              { value: "list", label: "List" },
              { value: "grid", label: "Grid" },
            ]}
          />
        </SettingsField>
        <SettingsField id="group-notes" label="Group notes by">
          <select
            id="group-notes"
            value={prefs.groupNotesBy}
            onChange={(event) =>
              setPrefs({
                groupNotesBy: event.target.value as typeof prefs.groupNotesBy,
              })
            }
            className={settingsSelectClassName}
          >
            <option value="none">None</option>
            <option value="category">Category</option>
            <option value="type">Type</option>
          </select>
        </SettingsField>
        <SettingsToggleRow
          label="Remember last selected category"
          checked={prefs.rememberLastCategory}
          onChange={(checked) => setPrefs({ rememberLastCategory: checked })}
        />
      </SettingsSubsection>

      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function AiSearchSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePreferences(patch: Partial<SerializedPreferences>) {
    setSaving(true);
    setFormError("");

    const { data: response } = await updatePreferencesRequest(patch);

    if (response?.ok) {
      setPreferences(response.preferences);
      toastSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      toastError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <SettingsSectionLoading message="Loading AI settings…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  if (!uiReady) {
    return <SettingsSectionLoading message="Loading AI settings…" />;
  }

  return (
    <SettingsPanel
      title="AI & Search"
      description="Control how MindVault assists you and how search behaves by default."
    >
      <SettingsSubsection title="AI settings">
        <div className="space-y-2">
          <SettingsToggleRow
            label="Enable AI Chat"
            description="Ask MindVault across your saved content."
            checked={data.preferences.ragEnabled}
            onChange={(checked) => void savePreferences({ ragEnabled: checked })}
            disabled={saving}
          />
          <SettingsToggleRow
            label="Use my content for better answers"
            description="Allow retrieval over your vault for chat and search."
            checked={data.preferences.aiAssistanceEnabled}
            onChange={(checked) =>
              void savePreferences({ aiAssistanceEnabled: checked })
            }
            disabled={saving}
          />
          <SettingsToggleRow
            label="Show source references"
            description="Cite notes used in AI answers."
            checked={prefs.showSourceReferences}
            onChange={(checked) => setPrefs({ showSourceReferences: checked })}
          />
        </div>
        <SettingsField id="ai-model" label="Preferred AI model">
          <select
            id="ai-model"
            value={prefs.preferredAiModel}
            onChange={(event) => setPrefs({ preferredAiModel: event.target.value })}
            className={settingsSelectClassName}
          >
            <option value="auto">Auto (recommended)</option>
            <option value="fast">Fast</option>
            <option value="quality">Higher quality</option>
          </select>
        </SettingsField>
      </SettingsSubsection>

      <SettingsSubsection title="Search settings">
        <SettingsField id="default-search" label="Default search type">
          <select
            id="default-search"
            value={data.preferences.defaultSearchMode}
            disabled={saving}
            onChange={(event) =>
              void savePreferences({ defaultSearchMode: event.target.value })
            }
            className={settingsSelectClassName}
          >
            <option value="KEYWORD">Keyword</option>
            <option value="SEMANTIC">Semantic</option>
          </select>
        </SettingsField>
        <SettingsField id="search-scope" label="Search scope">
          <select
            id="search-scope"
            value={prefs.searchScope}
            onChange={(event) =>
              setPrefs({ searchScope: event.target.value as typeof prefs.searchScope })
            }
            className={settingsSelectClassName}
          >
            <option value="all">Entire vault</option>
            <option value="notes">Notes only</option>
            <option value="links">Links & articles</option>
          </select>
        </SettingsField>
        <SettingsToggleRow
          label="Include code snippets"
          checked={prefs.searchIncludeCode}
          onChange={(checked) => setPrefs({ searchIncludeCode: checked })}
        />
        <SettingsToggleRow
          label="Show AI suggestions in search"
          checked={prefs.searchAiSuggestions}
          onChange={(checked) => setPrefs({ searchAiSuggestions: checked })}
        />
      </SettingsSubsection>

      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function PrivacySecuritySection() {
  const session = useVaultSession();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || submittingRef.current) return;

    submittingRef.current = true;
    setSaving(true);
    setErrors({});
    setFormError("");

    const { data } = await changePasswordRequest({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (data?.ok) {
      toastSuccess(PASSWORD_UPDATE_SUCCESS);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (data && !data.ok && data.errors) {
      setErrors(data.errors);
    } else {
      setFormError(data?.message || SETTINGS_SERVER_ERROR);
    }

    submittingRef.current = false;
    setSaving(false);
  }

  if (!uiReady) {
    return <SettingsSectionLoading message="Loading security…" />;
  }

  return (
    <SettingsPanel
      title="Privacy & Security"
      description="Manage sign-in, privacy controls, and how your data is used."
    >
      <SettingsSubsection title="Security">
        <div className="space-y-2">
          <SettingsActionRow
            icon={Lock}
            title="Change password"
            description="Update your password to keep your vault secure."
            onClick={() => {
              document.getElementById("change-password")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          />
          <SettingsInlineCard
            title="Two-factor authentication"
            description="Add an extra layer of protection to your account."
          >
            <span className="inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
              Not enabled
            </span>
          </SettingsInlineCard>
          <SettingsInlineCard
            title="Active sessions"
            description="MindVault tracks this browser session only."
          >
            <span className="text-[0.8125rem] font-medium text-foreground">1 active</span>
          </SettingsInlineCard>
        </div>

        <form
          id="change-password"
          onSubmit={handlePasswordSubmit}
          className={cn(settingsFormStackClassName, "scroll-mt-24 pt-2")}
        >
          <SettingsReadOnlyValue label="Signed in as" value={session.email} />
          <SettingsField
            id="current-password"
            label="Current password"
            error={errors.currentPassword}
          >
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={saving}
              className={settingsInputClassName}
              autoComplete="current-password"
            />
          </SettingsField>
          <SettingsField
            id="new-password"
            label="New password"
            error={errors.newPassword}
          >
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={saving}
              className={settingsInputClassName}
              autoComplete="new-password"
            />
          </SettingsField>
          <SettingsField
            id="confirm-password"
            label="Confirm new password"
            error={errors.confirmPassword}
          >
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={saving}
              className={settingsInputClassName}
              autoComplete="new-password"
            />
          </SettingsField>
          {formError ? <SettingsStatus message={formError} tone="error" /> : null}
          <SettingsFormFooter>
            <button type="submit" disabled={saving} className={vaultPrimaryButton}>
              {saving ? "Updating…" : "Change Password"}
            </button>
          </SettingsFormFooter>
        </form>

        <VaultLogoutAction
          label="Log out"
          className={cn(
            "w-full justify-center border border-border px-4 py-2.5",
            vaultActionShape,
          )}
        />
      </SettingsSubsection>

      <SettingsSubsection title="Privacy">
        <div className="space-y-2">
          <SettingsToggleRow
            label="Data usage for AI"
            description="Allow AI features to process your vault content on request."
            checked={prefs.dataUsageForAi}
            onChange={(checked) => setPrefs({ dataUsageForAi: checked })}
          />
          <SettingsToggleRow
            label="Analytics"
            description="Help improve MindVault with anonymous usage data."
            checked={prefs.analyticsEnabled}
            onChange={(checked) => setPrefs({ analyticsEnabled: checked })}
          />
          <SettingsToggleRow
            label="Personalized recommendations"
            description="Suggestions based on how you use your vault."
            checked={prefs.personalizedRecommendations}
            onChange={(checked) => setPrefs({ personalizedRecommendations: checked })}
          />
        </div>
      </SettingsSubsection>

      <SettingsInlineCard
        title="End-to-end encryption"
        description="Client-side encryption for vault content is on the roadmap."
      >
        <button type="button" className={vaultSecondaryButton}>
          Learn more
        </button>
      </SettingsInlineCard>
    </SettingsPanel>
  );
}

export function DataStorageSection() {
  const { data, loading, error } = useSettingsData();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();

  if (loading || !uiReady) {
    return <SettingsSectionLoading message="Loading storage…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  const { storage } = data;
  const usedMb = Math.max(1, Math.round(storage.totalNotes * 0.05));
  const limitMb = 1024;
  const usedPct = Math.min(100, Math.round((usedMb / limitMb) * 100));

  return (
    <SettingsPanel
      title="Data & Storage"
      description="See how much space your vault uses and manage backups."
    >
      <SettingsSubsection title="Storage usage">
        <div className="flex justify-between text-[0.8125rem]">
          <span className="text-muted-foreground">Vault storage</span>
          <span className="tabular-nums text-foreground">
            {usedMb} MB of {limitMb} GB
          </span>
        </div>
        <div className={settingsProgressTrackClassName}>
          <div
            className="h-full rounded-full bg-foreground/80"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <SettingsPanelHint>
          Estimates from note count until file-level metering ships.
        </SettingsPanelHint>
        <dl className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Total notes" value={storage.totalNotes} />
          <StatItem label="Categories" value={storage.totalCategories} />
          <StatItem label="Embeddings" value={storage.embeddedNotes} />
          <StatItem label="Missing embeddings" value={storage.missingEmbeddings} />
        </dl>
      </SettingsSubsection>

      <SettingsSubsection title="Data actions">
        <div className="space-y-2">
          <SettingsActionRow
            icon={ShieldCheck}
            title="Manage files"
            description="Attachments and uploads (coming soon)."
            onClick={() => toastInfo("File management is coming soon.")}
          />
          <SettingsActionRow
            icon={KeyRound}
            title="Export data"
            description="Download a JSON export of your vault."
            href={exportVaultDownloadUrl()}
          />
          <SettingsActionRow
            icon={Mail}
            title="Import data"
            description="Restore from a MindVault export file."
            onClick={() => toastInfo("Vault import is coming soon.")}
          />
        </div>
      </SettingsSubsection>

      <SettingsSubsection title="Backup & sync">
        <SettingsToggleRow
          label="Auto backup"
          description="Schedule exports to your connected storage."
          checked={prefs.autoBackup}
          onChange={(checked) => setPrefs({ autoBackup: checked })}
        />
        <SettingsMetadataRow label="Last backup" value="Not yet run" />
        <button
          type="button"
          className={vaultSecondaryButton}
          onClick={() => toastInfo("Scheduled backups are coming soon.")}
        >
          Back up now
        </button>
      </SettingsSubsection>
    </SettingsPanel>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-border bg-mv-panel/40 px-3.5 py-3">
      <dt className="text-[0.75rem] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[1.125rem] font-semibold tabular-nums tracking-[-0.02em] text-foreground">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

export function AdvancedSettingsSection() {
  const { data, loading, reload } = useSettingsData();
  const { prefs, setPrefs, ready: uiReady } = useSettingsUiPrefs();
  const [status, setStatus] = useState<{
    embeddedNotes: number;
    missingEmbeddings: number;
    totalNotes: number;
  } | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: response } = await fetchEmbeddingsStatus();
      if (response?.ok) {
        setStatus({
          embeddedNotes: response.embeddedNotes,
          missingEmbeddings: response.missingEmbeddings,
          totalNotes: response.totalNotes,
        });
      }
    })();
  }, [data?.storage.embeddedNotes, data?.storage.missingEmbeddings]);

  async function handleRebuild() {
    setRebuilding(true);
    setMessage("");
    setFormError("");

    const { data: response } = await rebuildEmbeddingsRequest();

    if (response?.ok) {
      if (response.total === 0) {
        setMessage("All notes already have current embeddings.");
      } else {
        setMessage(
          `Rebuilt ${response.succeeded} of ${response.total} missing embedding(s).`,
        );
      }
      await reload();
      const { data: statusResponse } = await fetchEmbeddingsStatus();
      if (statusResponse?.ok) {
        setStatus({
          embeddedNotes: statusResponse.embeddedNotes,
          missingEmbeddings: statusResponse.missingEmbeddings,
          totalNotes: statusResponse.totalNotes,
        });
      }
    } else {
      toastError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setRebuilding(false);
  }

  if (loading || !uiReady) {
    return <SettingsSectionLoading message="Loading advanced…" />;
  }

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Advanced"
        description="Developer tools, maintenance actions, and experimental features."
      >
        <SettingsSubsection title="Developer & API">
          <div className="grid gap-2 sm:grid-cols-2">
            <SettingsInlineCard
              title="API access"
              description="Generate and manage personal API keys."
            >
              <button
                type="button"
                className={vaultSecondaryButton}
                onClick={() => toastInfo("API keys are coming soon.")}
              >
                Manage keys
              </button>
            </SettingsInlineCard>
            <SettingsInlineCard
              title="Webhooks"
              description="Notify external services when vault content changes."
            >
              <button
                type="button"
                className={vaultSecondaryButton}
                onClick={() => toastInfo("Webhooks are coming soon.")}
              >
                Configure
              </button>
            </SettingsInlineCard>
          </div>
        </SettingsSubsection>

        <SettingsSubsection title="Data management">
          {status ? (
            <dl className="grid gap-3 sm:grid-cols-3">
              <StatItem label="Notes" value={status.totalNotes} />
              <StatItem label="Embedded" value={status.embeddedNotes} />
              <StatItem label="Needs embedding" value={status.missingEmbeddings} />
            </dl>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={vaultSecondaryButton}
              onClick={() => toastSuccess("Local cache cleared.")}
            >
              Clear cache
            </button>
            <button
              type="button"
              onClick={() => void handleRebuild()}
              disabled={rebuilding || (status?.missingEmbeddings ?? 0) === 0}
              className={cn(vaultSecondaryButton, "disabled:opacity-50")}
            >
              {rebuilding ? "Rebuilding…" : "Rebuild search index"}
            </button>
          </div>
          <SettingsPanelHint>
            Rebuild only generates embeddings for notes that are missing them.
          </SettingsPanelHint>
          {message ? <SettingsStatus message={message} /> : null}
          {formError ? <SettingsStatus message={formError} tone="error" /> : null}
        </SettingsSubsection>

        <SettingsSubsection title="Experimental features">
          <SettingsToggleRow
            label="Beta features"
            description="Try in-progress MindVault capabilities."
            checked={prefs.experimentalBetaFeatures}
            onChange={(checked) => setPrefs({ experimentalBetaFeatures: checked })}
          />
        </SettingsSubsection>
      </SettingsPanel>

      <DeleteAccountSection />
    </div>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const submittingRef = useRef(false);

  async function handleDelete(event: FormEvent) {
    event.preventDefault();
    if (deleting || submittingRef.current) return;

    submittingRef.current = true;
    setDeleting(true);
    setErrors({});
    setFormError("");

    const { data, response } = await deleteAccountRequest({
      currentPassword,
      confirmation,
    });

    if (data?.ok) {
      router.push(routes.signIn);
      router.refresh();
      return;
    }

    if (data && !data.ok && data.errors) {
      setErrors(data.errors);
    } else if (response.status === 401) {
      setErrors({ currentPassword: "Invalid password." });
    } else {
      setFormError(data?.message || SETTINGS_SERVER_ERROR);
    }

    submittingRef.current = false;
    setDeleting(false);
  }

  return (
    <SettingsDangerPanel
      title="Danger Zone"
      description="Permanently delete your account and all notes, categories, and embeddings. This cannot be undone."
    >
      <form onSubmit={handleDelete} className={settingsFormStackClassName}>
        <SettingsField
          id="delete-password"
          label="Current password"
          error={errors.currentPassword}
        >
          <input
            id="delete-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={deleting}
            className={settingsInputClassName}
            autoComplete="current-password"
          />
        </SettingsField>

        <SettingsField
          id="delete-confirm"
          label='Type DELETE to confirm'
          error={errors.confirmation}
        >
          <input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={deleting}
            className={settingsInputClassName}
            autoComplete="off"
          />
        </SettingsField>

        {formError ? <SettingsStatus message={formError} tone="error" /> : null}

        <button
          type="submit"
          disabled={deleting}
          className={cn(
            vaultDestructiveButton,
          )}
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </form>
    </SettingsDangerPanel>
  );
}
