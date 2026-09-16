"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="space-y-1">
        <h2 className="text-[0.95rem] text-white/88">{title}</h2>
        {description ? (
          <p className="text-[0.84rem] leading-relaxed text-white/42">{description}</p>
        ) : null}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
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
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[0.62rem] tracking-[0.16em] text-white/42 uppercase">
        {label}
      </span>
      {children}
      {error ? (
        <span id={`${id}-error`} className="text-[0.75rem] text-white/55">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[0.75rem] text-white/32">{hint}</span>
      ) : null}
    </label>
  );
}

export const settingsInputClassName =
  "min-h-10 w-full rounded-xl border border-white/12 bg-white/[0.035] px-3.5 py-2 text-[0.9rem] text-brand-ink outline-none transition-colors placeholder:text-white/28 focus:border-white/28 disabled:cursor-not-allowed disabled:opacity-60";

export const settingsSelectClassName = settingsInputClassName;

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
        "rounded-xl border px-3.5 py-2.5 text-[0.84rem]",
        tone === "success"
          ? "border-white/14 bg-white/[0.05] text-brand-ink"
          : "border-white/10 bg-white/[0.03] text-white/62",
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
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <div>
        <p className="text-[0.86rem] text-white/78">{label}</p>
        {description ? (
          <p className="mt-1 text-[0.78rem] leading-relaxed text-white/38">
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
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-white/20 bg-brand-ink"
            : "border-white/12 bg-white/[0.04]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-brand-void transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsReadOnlyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <p className="text-[0.62rem] tracking-[0.16em] text-white/38 uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-[0.88rem] text-white/78">{value}</p>
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
    <section className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-5 sm:p-6">
      <h2 className="text-[0.95rem] text-red-100/90">{title}</h2>
      <p className="mt-2 text-[0.84rem] leading-relaxed text-white/45">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
