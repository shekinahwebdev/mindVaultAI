"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import { ACCENT_COLOR_SWATCHES } from "@/lib/settings/appearance-prefs";
import {
  vaultCardTitleClassName,
  vaultLabelClassName,
  vaultMetaClassName,
} from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

/** Full-width settings layout inside the vault main column. */
export const settingsPageContainerClassName = "mx-auto w-full max-w-[90rem] px-0";

export const settingsCompositionClassName = "mx-auto w-full";

/** Nav card | main panel */
export const settingsGridClassName =
  "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,14.5rem)_minmax(0,1fr)] lg:gap-6";

export const settingsContentColumnClassName = "min-w-0 w-full";

export const settingsNavWidthClassName = "min-w-0 lg:sticky lg:top-4 lg:self-start";

export const settingsAsideColumnClassName =
  "min-w-0 xl:sticky xl:top-4 xl:self-start";

export const settingsNavCardClassName = cn(mvContentCardClassName, "p-2");

export const settingsAsideCardClassName = mvContentCardClassName;

export const settingsPanelSurfaceClassName = cn(
  mvContentCardClassName,
  "overflow-hidden",
);

export const settingsUtilityTitleClassName =
  "text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground";

export const settingsProgressTrackClassName =
  "h-1.5 w-full overflow-hidden rounded-full bg-mv-panel";

export const settingsSubsectionTitleClassName =
  "text-[0.8125rem] font-semibold text-foreground";

export function SettingsPanel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={settingsPanelSurfaceClassName}>
      <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6">
        <div className="min-w-0 space-y-1">
          <h2 className={cn(vaultCardTitleClassName, "text-[1.0625rem]")}>{title}</h2>
          {description ? (
            <p className={cn(vaultMetaClassName, "max-w-prose leading-relaxed")}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>
      <div className="space-y-6 px-5 py-6 sm:px-6">{children}</div>
    </section>
  );
}

export function SettingsSubsection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className={settingsSubsectionTitleClassName}>{title}</h3>
      {children}
    </div>
  );
}

export function SettingsActionRow({
  href,
  onClick,
  icon: Icon,
  title,
  description,
  tone = "default",
}: {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "danger";
}) {
  const className = cn(
    "group flex w-full items-center gap-3 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/30 px-3.5 py-3 text-left transition-colors",
    "hover:border-foreground/12 hover:bg-mv-panel/60",
    tone === "danger" && "border-red-400/15 hover:border-red-400/25",
  );

  const inner = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-surface",
          tone === "danger" && "border-red-400/20 text-red-500 dark:text-red-300",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.875rem] font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-mv-faint transition-transform group-hover:translate-x-0.5"
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function SettingsSectionLoading({ message }: { message: string }) {
  return (
    <section className={cn(settingsPanelSurfaceClassName, "px-6 py-8")}>
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

export function SettingsAvatarRow({
  initials,
  onChangePhotoDisabled,
}: {
  initials: string;
  onChangePhotoDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-mv-panel text-[1rem] font-semibold text-foreground"
      >
        {initials}
      </div>
      <div>
        <button
          type="button"
          disabled={onChangePhotoDisabled}
          className="rounded-[var(--mv-radius-control)] border border-border bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-mv-panel disabled:cursor-not-allowed disabled:opacity-50"
        >
          Change Photo
        </button>
        <p className="mt-1.5 text-[0.75rem] text-mv-faint">
          JPG, PNG or GIF. Max 2MB. Profile photos are coming soon.
        </p>
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
  "h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 px-3 text-[0.875rem] text-foreground outline-none transition-colors placeholder:text-mv-faint focus:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-60";

export const settingsTextareaClassName =
  "min-h-[6.5rem] w-full resize-y rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 px-3 py-2.5 text-[0.875rem] text-foreground outline-none transition-colors placeholder:text-mv-faint focus:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-60";

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
        className="flex h-10 items-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/35 px-3 text-[0.875rem] text-muted-foreground"
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

export function SettingsPanelHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.75rem] leading-relaxed text-mv-faint">{children}</p>
  );
}

export function SettingsAccentSwatches({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const swatches = ACCENT_COLOR_SWATCHES;

  return (
    <div className="flex flex-wrap gap-2.5">
      {swatches.map((swatch) => {
        const active = value === swatch.id;
        return (
          <button
            key={swatch.id}
            type="button"
            aria-label={swatch.label}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(swatch.id)}
            className={cn(
              "size-8 rounded-full border-2 transition-transform hover:scale-105 disabled:opacity-50",
              swatch.neutralSwatch
                ? cn(
                    "border-border shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]",
                    active && "border-foreground scale-105 ring-2 ring-foreground/25 ring-offset-2 ring-offset-background",
                  )
                : active
                  ? "border-foreground scale-105"
                  : "border-transparent",
            )}
            style={{ backgroundColor: swatch.hex }}
          />
        );
      })}
    </div>
  );
}

export function SettingsSegmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-[var(--mv-radius-control)] border border-border bg-mv-panel p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 rounded-[6px] px-3 text-[0.8125rem] font-medium transition-colors",
              active
                ? "bg-surface text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-[var(--mv-user-accent-border)]"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-50",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsMetaRow({
  label,
  description,
  trailing,
}: {
  label: string;
  description?: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-mv-panel/40 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

export function SettingsInlineCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/35 px-4 py-4">
      <p className="text-[0.875rem] font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
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
    <section className="rounded-[var(--mv-radius-card)] border border-red-400/20 bg-red-400/[0.04] px-6 py-6">
      <h2 className="text-[1.0625rem] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
