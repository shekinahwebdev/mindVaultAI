"use client";

import { cn } from "@/lib/utils";

import {
  vaultSegmentedItemActive,
  vaultSegmentedItemIdle,
  vaultSegmentedTrack,
} from "./vault-controls";

export function VaultSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={vaultSegmentedTrack}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-[0.8125rem] font-medium",
              active ? vaultSegmentedItemActive : vaultSegmentedItemIdle,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
