"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { vaultLabelClassName } from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

import { vaultInputClassName } from "../vault-controls";

type CaptureFieldBaseProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

const fieldLabelClassName = vaultLabelClassName;

const fieldInputClassName = cn(vaultInputClassName, "bg-surface");

function CaptureFieldMessage({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  if (error) {
    return (
      <span id={`${id}-error`} className="mt-1.5 text-[0.75rem] text-muted-foreground">
        {error}
      </span>
    );
  }

  if (hint) {
    return (
      <span id={`${id}-hint`} className="mt-1.5 text-[0.75rem] text-mv-faint">
        {hint}
      </span>
    );
  }

  return null;
}

type CaptureInputFieldProps = CaptureFieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function CaptureInputField({
  id,
  label,
  error,
  hint,
  className,
  disabled,
  ...inputProps
}: CaptureInputFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <label className={cn("flex w-full flex-col text-left", className)}>
      <span className={fieldLabelClassName}>{label}</span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        className={cn(
          fieldInputClassName,
          "mt-1.5 min-h-10 px-3.5 py-2",
          error && "border-foreground/25",
        )}
        {...inputProps}
      />
      <CaptureFieldMessage id={id} error={error} hint={hint} />
    </label>
  );
}

type CaptureTextareaFieldProps = CaptureFieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
    labelAddon?: ReactNode;
    textareaClassName?: string;
  };

export const CaptureTextareaField = forwardRef<
  HTMLTextAreaElement,
  CaptureTextareaFieldProps
>(function CaptureTextareaField(
  {
    id,
    label,
    labelAddon,
    error,
    hint,
    className,
    textareaClassName,
    disabled,
    ...textareaProps
  },
  ref,
) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <label className={cn("flex w-full flex-col text-left", className)}>
      <div className="flex items-end justify-between gap-3">
        <span className={fieldLabelClassName}>{label}</span>
        {labelAddon}
      </div>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        className={cn(
          fieldInputClassName,
          "mt-1.5 min-h-[11rem] resize-y px-3.5 py-3 leading-relaxed sm:min-h-[14rem]",
          textareaClassName,
          error && "border-foreground/25",
        )}
        {...textareaProps}
      />
      <CaptureFieldMessage id={id} error={error} hint={hint} />
    </label>
  );
});

type CaptureSelectFieldProps = CaptureFieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
    options: Array<{ value: string; label: string; disabled?: boolean }>;
  };

export function CaptureSelectField({
  id,
  label,
  error,
  hint,
  className,
  disabled,
  options,
  ...selectProps
}: CaptureSelectFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <label className={cn("flex w-full flex-col text-left", className)}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className="relative mt-1.5">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(
            fieldInputClassName,
            "min-h-10 appearance-none px-3.5 py-2 pr-9",
            error && "border-foreground/25",
            disabled && "cursor-not-allowed opacity-60",
          )}
          {...selectProps}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-surface text-foreground"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.65rem] text-mv-faint"
        >
          ▼
        </span>
      </div>
      <CaptureFieldMessage id={id} error={error} hint={hint} />
    </label>
  );
}
