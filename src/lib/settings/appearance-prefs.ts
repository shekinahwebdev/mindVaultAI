import {
  AccentColor,
  InterfaceDensity,
  ThemeMode,
  UiFontFamily,
} from "@/generated/prisma/enums";

export const ACCENT_COLOR_IDS = [
  "blue",
  "purple",
  "red",
  "orange",
  "yellow",
  "green",
  "pink",
  "white",
  "black",
] as const;

export type AccentColorId = (typeof ACCENT_COLOR_IDS)[number];

export const INTERFACE_DENSITY_IDS = ["comfortable", "compact", "minimal"] as const;
export type InterfaceDensityId = (typeof INTERFACE_DENSITY_IDS)[number];

export const UI_FONT_IDS = ["inter", "geist", "system"] as const;
export type UiFontId = (typeof UI_FONT_IDS)[number];

/** Display-only swatch colors — persisted values are semantic keys only. */
export const ACCENT_COLOR_SWATCHES: Array<{
  id: AccentColorId;
  label: string;
  hex: string;
  /** Always show a edge ring so light/dark swatches stay visible on any theme. */
  neutralSwatch?: boolean;
}> = [
  { id: "blue", label: "Blue", hex: "#3B82F6" },
  { id: "purple", label: "Purple", hex: "#A855F7" },
  { id: "red", label: "Red", hex: "#EF4444" },
  { id: "orange", label: "Orange", hex: "#F97316" },
  { id: "yellow", label: "Yellow", hex: "#EAB308" },
  { id: "green", label: "Green", hex: "#22C55E" },
  { id: "pink", label: "Pink", hex: "#EC4899" },
  { id: "white", label: "White", hex: "#FAFAFA", neutralSwatch: true },
  { id: "black", label: "Black", hex: "#171717", neutralSwatch: true },
];

const accentToPrisma: Record<AccentColorId, AccentColor> = {
  blue: AccentColor.BLUE,
  purple: AccentColor.PURPLE,
  red: AccentColor.RED,
  orange: AccentColor.ORANGE,
  yellow: AccentColor.YELLOW,
  green: AccentColor.GREEN,
  pink: AccentColor.PINK,
  white: AccentColor.WHITE,
  black: AccentColor.BLACK,
};

const accentFromPrisma: Record<AccentColor, AccentColorId> = {
  [AccentColor.BLUE]: "blue",
  [AccentColor.PURPLE]: "purple",
  [AccentColor.RED]: "red",
  [AccentColor.ORANGE]: "orange",
  [AccentColor.YELLOW]: "yellow",
  [AccentColor.GREEN]: "green",
  [AccentColor.PINK]: "pink",
  [AccentColor.WHITE]: "white",
  [AccentColor.BLACK]: "black",
};

const densityToPrisma: Record<InterfaceDensityId, InterfaceDensity> = {
  comfortable: InterfaceDensity.COMFORTABLE,
  compact: InterfaceDensity.COMPACT,
  minimal: InterfaceDensity.MINIMAL,
};

const densityFromPrisma: Record<InterfaceDensity, InterfaceDensityId> = {
  [InterfaceDensity.COMFORTABLE]: "comfortable",
  [InterfaceDensity.COMPACT]: "compact",
  [InterfaceDensity.MINIMAL]: "minimal",
};

const fontToPrisma: Record<UiFontId, UiFontFamily> = {
  inter: UiFontFamily.INTER,
  geist: UiFontFamily.GEIST,
  system: UiFontFamily.SYSTEM,
};

const fontFromPrisma: Record<UiFontFamily, UiFontId> = {
  [UiFontFamily.INTER]: "inter",
  [UiFontFamily.GEIST]: "geist",
  [UiFontFamily.SYSTEM]: "system",
};

export function isAccentColorId(value: string): value is AccentColorId {
  return (ACCENT_COLOR_IDS as readonly string[]).includes(value);
}

export function isInterfaceDensityId(value: string): value is InterfaceDensityId {
  return (INTERFACE_DENSITY_IDS as readonly string[]).includes(value);
}

export function isUiFontId(value: string): value is UiFontId {
  return (UI_FONT_IDS as readonly string[]).includes(value);
}

export function accentColorToPrisma(id: AccentColorId): AccentColor {
  return accentToPrisma[id];
}

export function accentColorFromPrisma(value: AccentColor): AccentColorId {
  return accentFromPrisma[value];
}

export function interfaceDensityToPrisma(id: InterfaceDensityId): InterfaceDensity {
  return densityToPrisma[id];
}

export function interfaceDensityFromPrisma(value: InterfaceDensity): InterfaceDensityId {
  return densityFromPrisma[value];
}

export function uiFontToPrisma(id: UiFontId): UiFontFamily {
  return fontToPrisma[id];
}

export function uiFontFromPrisma(value: UiFontFamily): UiFontId {
  return fontFromPrisma[value];
}

export function isThemeMode(value: string): value is ThemeMode {
  return Object.values(ThemeMode).includes(value as ThemeMode);
}
