"use client";

import { AvatarType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmojiAvatarCreator } from "@/components/vault/profile/EmojiAvatarCreator";
import { UserAvatar } from "@/components/vault/UserAvatar";
import type { SessionData } from "@/lib/auth/session";
import {
  APPROVED_AVATAR_EMOJIS,
  DEFAULT_AVATAR_BACKGROUND,
  type AvatarBackgroundKey,
} from "@/lib/profile/avatar-config";
import { isAvatarBackgroundKey } from "@/lib/profile/avatar-validation";
import type { SerializedAccount } from "@/lib/settings/settings-queries";
import { updateAvatarRequest } from "@/lib/settings/settings-client";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";
import { toastError, toastInfo, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { vaultSecondaryButton } from "../vault-controls";

type SettingsProfileAvatarProps = {
  session: SessionData;
  account: SerializedAccount;
  onUpdated: () => Promise<void>;
};

function defaultEmoji(account: SerializedAccount) {
  if (account.avatarEmoji && APPROVED_AVATAR_EMOJIS.includes(account.avatarEmoji)) {
    return account.avatarEmoji;
  }
  return APPROVED_AVATAR_EMOJIS[0] ?? "😀";
}

function defaultBackground(account: SerializedAccount): AvatarBackgroundKey {
  if (account.avatarBackground && isAvatarBackgroundKey(account.avatarBackground)) {
    return account.avatarBackground;
  }
  return DEFAULT_AVATAR_BACKGROUND;
}

export function SettingsProfileAvatar({
  session,
  account,
  onUpdated,
}: SettingsProfileAvatarProps) {
  const router = useRouter();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const showReset =
    account.avatarType === AvatarType.EMOJI || account.avatarType === AvatarType.IMAGE;

  async function saveAvatar(payload: Parameters<typeof updateAvatarRequest>[0]) {
    setSaving(true);
    const { data } = await updateAvatarRequest(payload);
    if (data?.ok) {
      toastSuccess("Profile avatar updated.");
      setCreatorOpen(false);
      await onUpdated();
      router.refresh();
    } else {
      toastError(data?.message || SETTINGS_SERVER_ERROR);
    }
    setSaving(false);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          session={session}
          size="xl"
          overrides={{
            avatarType: account.avatarType,
            avatarEmoji: account.avatarEmoji,
            avatarBackground: account.avatarBackground,
            avatarImageUrl: account.avatarImageUrl,
          }}
        />

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(vaultSecondaryButton, "text-[0.8125rem]")}
              onClick={() => toastInfo("Profile photo upload is coming soon.")}
            >
              Upload Photo
            </button>
            <button
              type="button"
              className={cn(vaultSecondaryButton, "text-[0.8125rem]")}
              onClick={() => setCreatorOpen(true)}
            >
              Choose Emoji
            </button>
          </div>

          {showReset ? (
            <button
              type="button"
              disabled={saving}
              className="self-start text-[0.8125rem] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
              onClick={() => void saveAvatar({ avatarType: AvatarType.INITIALS })}
            >
              Reset to initials
            </button>
          ) : (
            <p className="text-[0.75rem] text-mv-faint">
              Use an emoji avatar or upload a photo when ready.
            </p>
          )}
        </div>
      </div>

      <EmojiAvatarCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        initialEmoji={defaultEmoji(account)}
        initialBackground={defaultBackground(account)}
        confirming={saving}
        onConfirm={(draft) =>
          saveAvatar({
            avatarType: AvatarType.EMOJI,
            avatarEmoji: draft.emoji,
            avatarBackground: draft.background,
          })
        }
      />
    </>
  );
}
