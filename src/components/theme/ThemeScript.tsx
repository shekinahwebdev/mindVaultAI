import { themeInitScript, type ThemePreference } from "@/lib/theme";

export function ThemeScript({ preference }: { preference: ThemePreference }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeInitScript(preference) }}
    />
  );
}
