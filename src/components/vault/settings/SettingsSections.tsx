"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { VaultLogoutAction } from "@/components/vault/VaultLogoutAction";
import { useCategories } from "@/lib/categories/use-categories";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import { formatNoteDate } from "@/lib/notes/note-display";
import { routes } from "@/lib/routes";
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
  fetchSettings,
  rebuildEmbeddingsRequest,
  updateAccountRequest,
  updatePreferencesRequest,
} from "@/lib/settings/settings-client";
import type {
  SerializedAccount,
  SerializedPreferences,
  VaultStorageStats,
} from "@/lib/settings/settings-queries";
import { usePreferences } from "@/lib/settings/preferences-context";
import { getVaultInitials } from "@/lib/vault/user-display";
import { useVaultSession } from "@/components/vault/VaultSessionProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { toastError, toastSuccess } from "@/lib/vault-toast";
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
  SettingsDangerPanel,
  SettingsField,
  SettingsFormFooter,
  SettingsMetadataRow,
  SettingsPanel,
  SettingsProfileSummary,
  SettingsReadOnlyValue,
  SettingsSectionLoading,
  SettingsStatus,
  SettingsToggleRow,
  settingsFormStackClassName,
  settingsInputClassName,
  settingsSelectClassName,
} from "./settings-ui";

type SettingsData = {
  account: SerializedAccount;
  preferences: SerializedPreferences;
  storage: VaultStorageStats;
};

function useSettingsData() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyResponse = useCallback((response: Awaited<ReturnType<typeof fetchSettings>>["data"]) => {
    if (response?.ok) {
      setData({
        account: response.account,
        preferences: response.preferences,
        storage: response.storage,
      });
      setError("");
    } else {
      setError(response?.message || SETTINGS_LOAD_ERROR);
      setData(null);
    }
    setLoading(false);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: response } = await fetchSettings();
    applyResponse(response);
  }, [applyResponse]);

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then(({ data: response }) => {
      if (cancelled) {
        return;
      }
      applyResponse(response);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResponse]);

  return { data, loading, error, reload };
}

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

  return (
    <SettingsPanel
      title="Your account"
      description="Profile details for your MindVault workspace."
    >
      <SettingsProfileSummary
        initials={initials}
        name={data.account.name || "MindVault user"}
        email={data.account.email}
      />

      <form onSubmit={handleSubmit} className={settingsFormStackClassName}>
        <SettingsField id="account-name" label="Name" error={fieldError}>
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

        <SettingsReadOnlyValue label="Email" value={data.account.email} />

        <SettingsMetadataRow
          label="Member since"
          value={formatNoteDate(data.account.createdAt)}
        />

        {formError ? <SettingsStatus message={formError} tone="error" /> : null}

        <SettingsFormFooter>
          <button type="submit" disabled={saving} className={vaultPrimaryButton}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </SettingsFormFooter>
      </form>
    </SettingsPanel>
  );
}

export function AppearanceSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const { preference, setPreference } = useTheme();
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

  return (
    <SettingsPanel
      title="Appearance"
      description="Choose a light, dark, or system workspace. The preference is saved to your account and remembered on this device."
    >
      <div>
        <p className="mb-2 text-[0.8125rem] font-medium text-foreground">Theme</p>
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
                  "rounded-[8px] border px-3.5 py-3 text-left transition-colors",
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
      </div>

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

  return (
    <SettingsPanel
      title="Vault preferences"
      description="Defaults applied when you open Capture."
    >
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

      <p className="text-[0.78rem] text-mv-faint">
        Capture opens as a focused full-screen flow. More capture behavior
        options may come later.
      </p>

      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function AiSearchSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
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

  return (
    <SettingsPanel
      title="AI & Search"
      description="Control how MindVault assists you. AI suggestions can be reviewed before saving."
    >
      <SettingsToggleRow
        label="AI-assisted organization"
        description="Show Analyze in Capture to suggest title, type, and category."
        checked={data.preferences.aiAssistanceEnabled}
        onChange={(checked) =>
          void savePreferences({ aiAssistanceEnabled: checked })
        }
        disabled={saving}
      />

      <SettingsField id="default-search" label="Default search mode">
        <select
          id="default-search"
          value={data.preferences.defaultSearchMode}
          disabled={saving}
          onChange={(event) =>
            void savePreferences({ defaultSearchMode: event.target.value })
          }
          className={settingsSelectClassName}
        >
          <option value="KEYWORD" className="bg-surface text-foreground">
            Keyword
          </option>
          <option value="SEMANTIC" className="bg-surface text-foreground">
            Semantic
          </option>
        </select>
      </SettingsField>

      <SettingsToggleRow
        label="Ask MindVault"
        description="Enable RAG chat and agent actions in your vault."
        checked={data.preferences.ragEnabled}
        onChange={(checked) => void savePreferences({ ragEnabled: checked })}
        disabled={saving}
      />

      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function PrivacySecuritySection() {
  const session = useVaultSession();
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

  return (
    <>
      <SettingsPanel
        title="Privacy & Security"
        description="Your vault is private to your account. MindVault uses your saved content only for features you request — such as AI organization, semantic search, and Ask MindVault."
      >
        <SettingsReadOnlyValue
          label="Signed in as"
          value={session.email}
        />

        <form onSubmit={handlePasswordSubmit} className={settingsFormStackClassName}>
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

        <div className="border-t border-border pt-5">
          <VaultLogoutAction
            label="Log out"
            className={cn(
              "w-full justify-center border border-border px-4 py-2.5",
              vaultActionShape,
            )}
          />
        </div>

        <p className="text-[0.76rem] leading-relaxed text-mv-faint">
          Individual device sessions are not tracked. Logging out clears this
          browser&apos;s session cookie.
        </p>
      </SettingsPanel>
    </>
  );
}

export function DataStorageSection() {
  const { data, loading, error } = useSettingsData();

  if (loading) {
    return <SettingsSectionLoading message="Loading storage…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  const { storage } = data;

  return (
    <SettingsPanel
      title="Data & Storage"
      description="A snapshot of what is in your vault."
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        <StatItem label="Total notes" value={storage.totalNotes} />
        <StatItem label="Categories" value={storage.totalCategories} />
        <StatItem label="Embeddings" value={storage.embeddedNotes} />
        <StatItem label="Missing embeddings" value={storage.missingEmbeddings} />
      </dl>

      {Object.keys(storage.typeCounts).length > 0 ? (
        <div className="space-y-2">
          <p className="text-[0.75rem] font-medium text-muted-foreground">
            By type
          </p>
          <ul className="space-y-1.5">
            {Object.entries(storage.typeCounts).map(([type, count]) => (
              <li
                key={type}
                className="flex items-center justify-between rounded-lg border border-border bg-mv-panel px-3 py-2 text-[0.82rem]"
              >
                <span className="text-muted-foreground">{type}</span>
                <span className="text-mv-faint">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[0.78rem] text-mv-faint">
        MindVault does not track approximate file storage size yet.
      </p>

      <a
        href={exportVaultDownloadUrl()}
        className={cn(
          vaultSecondaryButton,
        )}
      >
        Export Vault (JSON)
      </a>
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

  if (loading) {
    return <SettingsSectionLoading message="Loading advanced…" />;
  }

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Advanced"
        description="Technical status for semantic search. Only missing or outdated embeddings are rebuilt."
      >
        {status ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            <StatItem label="Notes" value={status.totalNotes} />
            <StatItem label="Embedded" value={status.embeddedNotes} />
            <StatItem label="Needs embedding" value={status.missingEmbeddings} />
          </dl>
        ) : null}

        <button
          type="button"
          onClick={() => void handleRebuild()}
          disabled={rebuilding || (status?.missingEmbeddings ?? 0) === 0}
          className={cn(
            "inline-flex min-h-10 items-center border border-border px-4 text-[0.74rem] text-[0.875rem] font-medium text-foreground/90 transition-colors hover:border-foreground/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            vaultActionShape,
          )}
        >
          {rebuilding ? "Rebuilding..." : "Rebuild Missing Embeddings"}
        </button>

        <p className="text-[0.78rem] text-mv-faint">
          This only generates embeddings for notes that are missing them or use
          an outdated model configuration. It does not regenerate every note.
        </p>

        {message ? <SettingsStatus message={message} /> : null}
        {formError ? <SettingsStatus message={formError} tone="error" /> : null}
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
