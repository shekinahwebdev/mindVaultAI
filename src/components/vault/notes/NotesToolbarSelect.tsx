"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type NotesToolbarSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  className?: string;
};

export function NotesToolbarSelect({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  className,
}: NotesToolbarSelectProps) {
  return (
    <div className={cn("relative min-w-[6.5rem] shrink-0 sm:min-w-[7.25rem]", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-[var(--mv-radius-control)] border border-border bg-mv-panel",
          "pl-3 pr-8 text-[0.8125rem] font-medium text-foreground outline-none",
          "focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/30",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {options.map((option) => (
          <option key={option.value || `all-${label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-mv-faint"
      />
    </div>
  );
}
