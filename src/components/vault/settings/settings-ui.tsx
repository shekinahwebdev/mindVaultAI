"use client";

import type { ReactNode } from "react";

import {
  vaultCardTitleClassName,
  vaultLabelClassName,
  vaultMetaClassName,
} from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

/** Outer settings page — centers in the main column (after sidebar). */
export const settingsPageContainerClassName =
  "mx-auto w-full max-w-[75rem] px-0 sm:px-0";

/** Title + nav + panel share one centered composition. */
export const settingsCompositionClassName =
  "mx-auto w-full max-w-[66rem]";

/** Nav + content grid; content column capped (~800px). */
export const settingsGridClassName =
  "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)] md:gap-7 lg:grid-cols-[13.75rem_minmax(0,50rem)] lg:gap-8";

export const settingsContentColumnClassName = "min-w-0 w-full max-w-[50rem]";

/** @deprecated Use grid column sizing via settingsGridClassName */
export const settingsNavWidthClassName = "min-w-0";

export const settingsPanelSurfaceClassName =
  "rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.025)]";

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(settingsPanelSurfaceClassName, "px-6 py-6")}>
      <header className="space-y-1">
        <h2 className={vaultCardTitleClassName}>{title}</h2>
        {description ? (
          <p className={cn(vaultMetaClassName, "max-w-prose leading-relaxed")}>
            {description}
          </p>
        ) : null}
      </header>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function SettingsSectionLoading({ message }: { message: string }) {
  return (
    <section className={cn(settingsPanelSurfaceClassName, "px-6 py-6")}>
      <p className="text-[0.875rem] text-muted-foreground">{message}</p>
    </section>
  );
}

export function SettingsProfileSummary({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-mv-panel/50 px-3.5 py-3">
      <div
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-[0.8125rem] font-medium text-primary-foreground"
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[0.9375rem] font-medium text-foreground">
          {name}
        </p>
        <p className="truncate text-[0.8125rem] text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

export function SettingsField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={vaultLabelClassName}>
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className="text-[0.75rem] text-muted-foreground">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[0.75rem] text-mv-faint">{hint}</span>
      ) : null}
    </div>
  );
}

export const settingsInputClassName =
  "h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-[0.875rem] text-foreground outline-none transition-colors placeholder:text-mv-faint focus:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-60";

export const settingsSelectClassName = settingsInputClassName;

export const settingsFormStackClassName = "space-y-5";

export function SettingsFormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end border-t border-border pt-5">{children}</div>
  );
}

export function SettingsStatus({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[8px] border px-3 py-2 text-[0.8125rem]",
        tone === "success"
          ? "border-border bg-mv-panel text-foreground"
          : "border-border bg-mv-panel text-muted-foreground",
      )}
    >
      {message}
    </p>
  );
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[10px] border border-border bg-mv-panel/40 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200",
          checked
            ? "border-foreground/20 bg-primary"
            : "border-border bg-surface",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-primary-foreground transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

/** Read-only value styled like a non-editable field (e.g. email). */
export function SettingsReadOnlyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.8125rem] font-medium text-foreground">{label}</span>
      <div
        aria-readonly="true"
        className="flex h-10 items-center rounded-[8px] border border-dashed border-border bg-mv-panel/35 px-3 text-[0.875rem] text-muted-foreground"
      >
        {value}
      </div>
    </div>
  );
}

/** Compact informational metadata (e.g. member since). */
export function SettingsMetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1">
      <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
      <span className="text-[0.8125rem] font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SettingsDangerPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-red-400/20 bg-red-400/[0.04] px-6 py-6">
      <h2 className="text-[1.0625rem] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
