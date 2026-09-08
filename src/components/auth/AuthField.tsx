"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function AuthField({
  id,
  label,
  error,
  hint,
  type,
  disabled,
  ...inputProps
}: AuthFieldProps) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <label className="flex w-full flex-col text-left">
      <span className="text-[0.62rem] tracking-[0.16em] text-white/42 uppercase">
        {label}
      </span>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`min-h-9 w-full rounded-xl border bg-white/[0.035] py-2 text-[0.9rem] text-brand-ink outline-none transition-colors placeholder:text-white/28 ${
            isPassword ? "px-3.5 pr-10" : "px-3.5"
          } ${
            error
              ? "border-white/28"
              : "border-white/12 focus:border-white/28"
          }`}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            disabled={disabled}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-white/42 transition-colors hover:text-white/75 disabled:pointer-events-none disabled:opacity-40"
          >
            {visible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <span id={`${id}-error`} className="mt-1 text-[0.75rem] text-white/55">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="mt-1 text-[0.75rem] text-white/32">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
