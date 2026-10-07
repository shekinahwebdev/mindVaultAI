"use client";

import { useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import { vaultPrimaryButton, vaultSecondaryButton } from "@/components/vault/vault-controls";
import {
  AVATAR_BACKGROUND_KEYS,
  AVATAR_EMOJI_GROUPS,
  avatarBackgroundClassName,
  avatarBackgroundLabels,
  emojiAvatarFontClassName,
  type AvatarBackgroundKey,
} from "@/lib/profile/avatar-config";
import { cn } from "@/lib/utils";

export type EmojiAvatarDraft = {
  emoji: string;
  background: AvatarBackgroundKey;
};

type EmojiAvatarCreatorProps = {
  open: boolean;
  onClose: () => void;
  initialEmoji: string;
  initialBackground: AvatarBackgroundKey;
  onConfirm: (draft: EmojiAvatarDraft) => void | Promise<void>;
  confirming?: boolean;
};

type EmojiAvatarCreatorFormProps = Omit<
  EmojiAvatarCreatorProps,
  "open" | "initialEmoji" | "initialBackground"
> & {
  initialEmoji: string;
  initialBackground: AvatarBackgroundKey;
};

function EmojiAvatarCreatorForm({
  initialEmoji,
  initialBackground,
  onClose,
  onConfirm,
  confirming = false,
}: EmojiAvatarCreatorFormProps) {
  const reduceMotion = useReducedMotion();
  const [draftEmoji, setDraftEmoji] = useState(initialEmoji);
  const [draftBackground, setDraftBackground] = useState(initialBackground);
  const previewKey = `${draftEmoji}:${draftBackground}`;

  return (
    <div className="flex max-h-[calc(92dvh-8rem)] flex-col gap-5 overflow-hidden">
      <div className="flex shrink-0 justify-center py-2">
        <div
          key={previewKey}
          className={cn(
            "flex size-[8.75rem] items-center justify-center rounded-full border border-white/10 shadow-[0_12px_40px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.14)]",
            avatarBackgroundClassName[draftBackground],
            !reduceMotion && "motion-safe:animate-[mv-avatar-pop_220ms_ease-out]",
          )}
        >
          <span
            className={cn(
              emojiAvatarFontClassName,
              "text-[4rem] leading-none sm:text-[4.5rem]",
            )}
          >
            {draftEmoji}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5">
        {AVATAR_EMOJI_GROUPS.map((group) => (
          <section key={group.id}>
            <p className="mb-2 text-[0.75rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = option.emoji === draftEmoji;
                return (
                  <button
                    key={option.emoji}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={selected}
                    disabled={confirming}
                    onClick={() => setDraftEmoji(option.emoji)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-[12px] border bg-mv-panel/50 transition-[transform,box-shadow,border-color] duration-200",
                      emojiAvatarFontClassName,
                      "text-[1.35rem] leading-none",
                      selected
                        ? "scale-105 border-foreground/30 bg-surface shadow-[0_0_0_2px_var(--color-ring)]"
                        : "border-border hover:scale-105 hover:border-foreground/15 hover:bg-mv-panel",
                      confirming && "opacity-60",
                    )}
                  >
                    {option.emoji}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          <p className="mb-2 text-[0.75rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Background
          </p>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_BACKGROUND_KEYS.map((key) => {
              const selected = key === draftBackground;
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={avatarBackgroundLabels[key]}
                  aria-pressed={selected}
                  disabled={confirming}
                  onClick={() => setDraftBackground(key)}
                  className={cn(
                    "relative size-9 rounded-full border-2 transition-transform duration-200 hover:scale-105 disabled:opacity-60",
                    avatarBackgroundClassName[key],
                    selected ? "border-foreground scale-105" : "border-transparent",
                  )}
                >
                  {selected ? (
                    <Check
                      aria-hidden
                      className="absolute inset-0 m-auto size-4 text-white drop-shadow-sm"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={confirming}
          className={vaultSecondaryButton}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={() => void onConfirm({ emoji: draftEmoji, background: draftBackground })}
          className={vaultPrimaryButton}
        >
          {confirming ? "Saving…" : "Use Avatar"}
        </button>
      </div>
    </div>
  );
}

export function EmojiAvatarCreator({
  open,
  onClose,
  initialEmoji,
  initialBackground,
  onConfirm,
  confirming = false,
}: EmojiAvatarCreatorProps) {
  return (
    <VaultDialog
      open={open}
      title="Choose your avatar"
      description="Pick an emoji and background. Your vault will use this everywhere."
      onClose={onClose}
      className="max-h-[min(92dvh,720px)] max-w-lg overflow-hidden sm:max-w-xl"
    >
      {open ? (
        <EmojiAvatarCreatorForm
          key={`${initialEmoji}:${initialBackground}`}
          initialEmoji={initialEmoji}
          initialBackground={initialBackground}
          onClose={onClose}
          onConfirm={onConfirm}
          confirming={confirming}
        />
      ) : null}
    </VaultDialog>
  );
}
