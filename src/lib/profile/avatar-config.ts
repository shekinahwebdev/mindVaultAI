/** Curated avatar backgrounds — keys persisted server-side; colors from theme-safe classes. */
export const AVATAR_BACKGROUND_KEYS = [
  "black",
  "slate",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
] as const;

export type AvatarBackgroundKey = (typeof AVATAR_BACKGROUND_KEYS)[number];

export const DEFAULT_AVATAR_BACKGROUND: AvatarBackgroundKey = "purple";

export const avatarBackgroundClassName: Record<AvatarBackgroundKey, string> = {
  black: "bg-neutral-950",
  slate: "bg-slate-600",
  blue: "bg-blue-500",
  purple: "bg-violet-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
};

export const avatarBackgroundLabels: Record<AvatarBackgroundKey, string> = {
  black: "Black background",
  slate: "Slate background",
  blue: "Blue background",
  purple: "Purple background",
  pink: "Pink background",
  red: "Red background",
  orange: "Orange background",
  yellow: "Yellow background",
  green: "Green background",
  teal: "Teal background",
};

export type AvatarEmojiOption = {
  emoji: string;
  label: string;
};

export const AVATAR_EMOJI_GROUPS: Array<{ id: string; label: string; options: AvatarEmojiOption[] }> =
  [
    {
      id: "faces",
      label: "Faces",
      options: [
        { emoji: "😀", label: "Grinning face" },
        { emoji: "😎", label: "Smiling face with sunglasses" },
        { emoji: "🤓", label: "Nerd face" },
        { emoji: "😊", label: "Smiling face" },
        { emoji: "🥳", label: "Partying face" },
        { emoji: "😌", label: "Relieved face" },
      ],
    },
    {
      id: "tech",
      label: "Tech & intelligence",
      options: [
        { emoji: "🧠", label: "Brain" },
        { emoji: "🤖", label: "Robot" },
        { emoji: "💻", label: "Laptop" },
        { emoji: "👩‍💻", label: "Woman technologist" },
        { emoji: "👨‍💻", label: "Man technologist" },
        { emoji: "🧑‍💻", label: "Technologist" },
      ],
    },
    {
      id: "knowledge",
      label: "Knowledge",
      options: [
        { emoji: "📚", label: "Books" },
        { emoji: "📖", label: "Open book" },
        { emoji: "✏️", label: "Pencil" },
        { emoji: "💡", label: "Light bulb" },
        { emoji: "🔬", label: "Microscope" },
      ],
    },
    {
      id: "energy",
      label: "Energy",
      options: [
        { emoji: "🚀", label: "Rocket" },
        { emoji: "🔥", label: "Fire" },
        { emoji: "✨", label: "Sparkles" },
        { emoji: "⚡", label: "High voltage" },
        { emoji: "🎯", label: "Direct hit" },
      ],
    },
    {
      id: "nature",
      label: "Nature & personality",
      options: [
        { emoji: "🌱", label: "Seedling" },
        { emoji: "🌸", label: "Cherry blossom" },
        { emoji: "🌙", label: "Crescent moon" },
        { emoji: "⭐", label: "Star" },
        { emoji: "🦋", label: "Butterfly" },
        { emoji: "🌊", label: "Water wave" },
      ],
    },
  ];

export const APPROVED_AVATAR_EMOJIS = AVATAR_EMOJI_GROUPS.flatMap((group) =>
  group.options.map((option) => option.emoji),
);

export const emojiAvatarFontClassName =
  "font-[family-name:var(--font-emoji,Apple_Color_Emoji,Segoe_UI_Emoji,Noto_Color_Emoji,sans-serif)]";
