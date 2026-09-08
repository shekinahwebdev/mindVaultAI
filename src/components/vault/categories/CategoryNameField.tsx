"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type CategoryNameFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function CategoryNameField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  autoFocus,
}: CategoryNameFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <label className="flex w-full flex-col text-left">
      <span className="text-[0.62rem] tracking-[0.16em] text-white/42 uppercase">
        {label}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-1.5 min-h-10 w-full rounded-xl border bg-white/[0.035] px-3.5 py-2 text-[0.9rem] text-brand-ink outline-none transition-colors placeholder:text-white/28",
          error
            ? "border-white/28"
            : "border-white/12 focus:border-white/28",
        )}
      />
      {error ? (
        <span id={`${id}-error`} className="mt-1.5 text-[0.75rem] text-white/55">
          {error}
        </span>
      ) : null}
    </label>
  );
}
