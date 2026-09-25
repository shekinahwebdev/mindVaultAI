export const THEME_COOKIE = "mindvault-theme-v2";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function parseThemePreference(
  value?: string | null,
): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return null;
}

export function prismaThemeToPreference(theme: string): ThemePreference {
  const parsed = parseThemePreference(theme.toLowerCase());
  return parsed ?? "light";
}

export function preferenceToPrismaTheme(preference: ThemePreference) {
  return preference.toUpperCase() as "LIGHT" | "DARK" | "SYSTEM";
}

export function resolveTheme(
  preference: ThemePreference,
  systemIsLight: boolean,
): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return systemIsLight ? "light" : "dark";
}

export function themeCookieMaxAge() {
  return 60 * 60 * 24 * 365;
}

export function applyDocumentTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;

  const app = document.getElementById("mv-app");
  if (app) {
    app.classList.remove("light", "dark");
    app.classList.add("mv-app", resolved);
  }
}

export function themeInitScript(preference: ThemePreference) {
  return `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var pref=m?decodeURIComponent(m[1]):${JSON.stringify(preference)};var resolved=pref==="light"||pref==="dark"?pref:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var root=document.documentElement;root.classList.remove("light","dark");root.classList.add(resolved);root.style.colorScheme=resolved;var el=document.getElementById("mv-app");if(el){el.classList.remove("light","dark");el.classList.add("mv-app",resolved);}}catch(e){}})();`;
}

export function persistThemeCookie(preference: ThemePreference) {
  document.cookie = `${THEME_COOKIE}=${preference}; Path=/; Max-Age=${themeCookieMaxAge()}; SameSite=Lax`;
}
