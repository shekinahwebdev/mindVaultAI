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
import { cn } from "@/lib/utils";

import {
  SettingsDangerPanel,
  SettingsField,
  SettingsPanel,
  SettingsReadOnlyValue,
  SettingsStatus,
  SettingsToggleRow,
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
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || submittingRef.current) return;

    submittingRef.current = true;
    setSaving(true);
    setFieldError("");
    setFormError("");
    setSuccess("");

    const { data: response } = await updateAccountRequest(name.trim());

    if (response?.ok) {
      setSuccess(ACCOUNT_UPDATE_SUCCESS);
      setNameDraft(null);
      await reload();
      await refreshPreferences();
      router.refresh();
    } else if (response && !response.ok && response.errors?.name) {
      setFieldError(response.errors.name);
    } else {
      setFormError(response?.message || SETTINGS_SERVER_ERROR);
    }

    submittingRef.current = false;
    setSaving(false);
  }

  if (loading) {
    return <p className="text-[0.84rem] text-white/42">Loading account...</p>;
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
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[0.9rem] text-white/72"
        >
          {initials}
        </div>
        <div>
          <p className="text-[0.88rem] text-white/82">
            {data.account.name || "MindVault user"}
          </p>
          <p className="text-[0.78rem] text-white/38">{data.account.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SettingsField id="account-name" label="Name" error={fieldError}>
          <input
            id="account-name"
            value={name}
            onChange={(event) => {
              setNameDraft(event.target.value);
              setFieldError("");
              setSuccess("");
            }}
            disabled={saving}
            className={settingsInputClassName}
            autoComplete="name"
          />
        </SettingsField>

        <SettingsReadOnlyValue label="Email" value={data.account.email} />

        <SettingsReadOnlyValue
          label="Member since"
          value={formatNoteDate(data.account.createdAt)}
        />

        {success ? <SettingsStatus message={success} /> : null}
        {formError ? <SettingsStatus message={formError} tone="error" /> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-10 items-center rounded-full bg-brand-ink px-5 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </SettingsPanel>
  );
}

export function AppearanceSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveReducedMotion(next: boolean) {
    setSaving(true);
    setSuccess("");
    setFormError("");

    const { data: response } = await updatePreferencesRequest({
      reducedMotion: next,
    });

    if (response?.ok) {
      setPreferences(response.preferences);
      setSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      setFormError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-[0.84rem] text-white/42">Loading appearance...</p>;
  }

  if (error || !data) {
    return <SettingsStatus message={error || SETTINGS_LOAD_ERROR} tone="error" />;
  }

  return (
    <SettingsPanel
      title="Appearance"
      description="MindVault is designed as a dark, focused workspace."
    >
      <SettingsReadOnlyValue label="Theme" value="Dark" />
      <p className="text-[0.78rem] text-white/32">
        Light and System themes are coming soon. MindVault&apos;s current interface
        is built for a dark, minimal reading experience.
      </p>

      <SettingsToggleRow
        label="Reduced motion"
        description="Minimize non-essential animations across the vault."
        checked={data.preferences.reducedMotion}
        onChange={(checked) => void saveReducedMotion(checked)}
        disabled={saving}
      />

      {success ? <SettingsStatus message={success} /> : null}
      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function VaultPreferencesSection() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePreferences(patch: Partial<SerializedPreferences>) {
    setSaving(true);
    setSuccess("");
    setFormError("");

    const { data: response } = await updatePreferencesRequest(patch);

    if (response?.ok) {
      setPreferences(response.preferences);
      setSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      setFormError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-[0.84rem] text-white/42">Loading preferences...</p>;
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
              className="bg-[#111114] text-brand-ink"
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
          <option value="" className="bg-[#111114] text-brand-ink">
            None / Uncategorized
          </option>
          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
              className="bg-[#111114] text-brand-ink"
            >
              {category.name}
            </option>
          ))}
        </select>
      </SettingsField>

      <p className="text-[0.78rem] text-white/32">
        Capture opens as a focused full-screen flow. More capture behavior
        options may come later.
      </p>

      {success ? <SettingsStatus message={success} /> : null}
      {formError ? <SettingsStatus message={formError} tone="error" /> : null}
    </SettingsPanel>
  );
}

export function AiSearchSettingsSection() {
  const { data, loading, error, reload } = useSettingsData();
  const { setPreferences } = usePreferences();
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePreferences(patch: Partial<SerializedPreferences>) {
    setSaving(true);
    setSuccess("");
    setFormError("");

    const { data: response } = await updatePreferencesRequest(patch);

    if (response?.ok) {
      setPreferences(response.preferences);
      setSuccess(PREFERENCES_UPDATE_SUCCESS);
      await reload();
    } else {
      setFormError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-[0.84rem] text-white/42">Loading AI settings...</p>;
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
          <option value="KEYWORD" className="bg-[#111114] text-brand-ink">
            Keyword
          </option>
          <option value="SEMANTIC" className="bg-[#111114] text-brand-ink">
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

      {success ? <SettingsStatus message={success} /> : null}
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
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || submittingRef.current) return;

    submittingRef.current = true;
    setSaving(true);
    setErrors({});
    setFormError("");
    setSuccess("");

    const { data } = await changePasswordRequest({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (data?.ok) {
      setSuccess(PASSWORD_UPDATE_SUCCESS);
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

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

          {success ? <SettingsStatus message={success} /> : null}
          {formError ? <SettingsStatus message={formError} tone="error" /> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center rounded-full bg-brand-ink px-5 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase disabled:opacity-70"
            >
              {saving ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>

        <div className="border-t border-white/[0.06] pt-4">
          <VaultLogoutAction
            label="Log out"
            className="w-full justify-center rounded-full border border-white/12 px-4 py-2.5"
          />
        </div>

        <p className="text-[0.76rem] leading-relaxed text-white/32">
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
    return <p className="text-[0.84rem] text-white/42">Loading storage...</p>;
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
          <p className="text-[0.62rem] tracking-[0.16em] text-white/38 uppercase">
            By type
          </p>
          <ul className="space-y-1.5">
            {Object.entries(storage.typeCounts).map(([type, count]) => (
              <li
                key={type}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[0.82rem]"
              >
                <span className="text-white/62">{type}</span>
                <span className="text-white/38">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[0.78rem] text-white/32">
        MindVault does not track approximate file storage size yet.
      </p>

      <a
        href={exportVaultDownloadUrl()}
        className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[0.74rem] tracking-[0.12em] text-white/72 uppercase transition-colors hover:border-white/20 hover:text-white/88"
      >
        Export Vault (JSON)
      </a>
    </SettingsPanel>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <dt className="text-[0.62rem] tracking-[0.16em] text-white/38 uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 font-editorial text-[1.35rem] text-brand-ink italic">
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
      setFormError(response?.message || SETTINGS_SERVER_ERROR);
    }

    setRebuilding(false);
  }

  if (loading) {
    return <p className="text-[0.84rem] text-white/42">Loading advanced...</p>;
  }

  return (
    <>
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
            "inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[0.74rem] tracking-[0.12em] text-white/72 uppercase transition-colors hover:border-white/20 hover:text-white/88 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {rebuilding ? "Rebuilding..." : "Rebuild Missing Embeddings"}
        </button>

        <p className="text-[0.78rem] text-white/32">
          This only generates embeddings for notes that are missing them or use
          an outdated model configuration. It does not regenerate every note.
        </p>

        {message ? <SettingsStatus message={message} /> : null}
        {formError ? <SettingsStatus message={formError} tone="error" /> : null}
      </SettingsPanel>

      <DeleteAccountSection />
    </>
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
      <form onSubmit={handleDelete} className="space-y-4">
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
          className="inline-flex min-h-10 items-center rounded-full border border-red-400/30 bg-red-400/[0.08] px-4 text-[0.72rem] tracking-[0.12em] text-red-200/90 uppercase disabled:opacity-70"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </form>
    </SettingsDangerPanel>
  );
}
