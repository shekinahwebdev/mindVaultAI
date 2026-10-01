export type SerializedUserAvatar = {
  avatarType: string;
  avatarEmoji: string | null;
  avatarBackground: string | null;
  avatarImageUrl: string | null;
};

export type UserAvatarProfile = {
  avatarType: string;
  avatarEmoji: string | null;
  avatarBackground: string | null;
  avatarImageUrl: string | null;
};

export function serializeUserAvatar(user: UserAvatarProfile): SerializedUserAvatar {
  return {
    avatarType: user.avatarType,
    avatarEmoji: user.avatarEmoji,
    avatarBackground: user.avatarBackground,
    avatarImageUrl: user.avatarImageUrl,
  };
}
