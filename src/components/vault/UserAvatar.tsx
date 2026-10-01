"use client";

import Image from "next/image";

import type { SessionData } from "@/lib/auth/session";
import {
  avatarBackgroundClassName,
  emojiAvatarFontClassName,
} from "@/lib/profile/avatar-config";
import { resolveUserAvatar } from "@/lib/profile/resolve-user-avatar";
import type { SerializedUserAvatar } from "@/lib/profile/user-avatar-types";
import { cn } from "@/lib/utils";

export type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClassName: Record<UserAvatarSize, { shell: string; emoji: string; initials: string }> =
  {
    sm: {
      shell: "size-8",
      emoji: "text-[1.35rem] leading-none",
      initials: "text-[0.68rem]",
    },
    md: {
      shell: "size-9",
      emoji: "text-[1.5rem] leading-none",
      initials: "text-[0.75rem]",
    },
    lg: {
      shell: "size-10",
      emoji: "text-[1.65rem] leading-none",
      initials: "text-[0.8125rem]",
    },
    xl: {
      shell: "size-20 sm:size-24",
      emoji: "text-[3.25rem] sm:text-[3.75rem] leading-none",
      initials: "text-[1rem] sm:text-[1.125rem]",
    },
  };

type UserAvatarProps = {
  session: SessionData;
  size?: UserAvatarSize;
  className?: string;
  overrides?: Partial<SerializedUserAvatar>;
};

export function UserAvatar({
  session,
  size = "md",
  className,
  overrides,
}: UserAvatarProps) {
  const resolved = resolveUserAvatar(session, overrides);
  const sizing = sizeClassName[size];

  if (resolved.mode === "image" && resolved.imageUrl) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-mv-panel",
          sizing.shell,
          className,
        )}
      >
        <Image
          src={resolved.imageUrl}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  if (resolved.mode === "emoji" && resolved.emoji) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
          sizing.shell,
          resolved.backgroundKey
            ? avatarBackgroundClassName[resolved.backgroundKey]
            : "bg-violet-500",
          className,
        )}
      >
        <span className={cn(emojiAvatarFontClassName, sizing.emoji)}>{resolved.emoji}</span>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground",
        sizing.shell,
        sizing.initials,
        className,
      )}
    >
      {resolved.initials}
    </span>
  );
}
