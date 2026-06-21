import { useEffect, useState } from "react";

// Keep this key in sync with the inline boot script in index.html.
export const THEME_KEY = "chaos_theme";
export const THEME_OPTIONS = ["light", "dark", "system"];

export function getStoredThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (THEME_OPTIONS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

export function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function resolveTheme(preference) {
  return preference === "system"
    ? getSystemPrefersDark() ? "dark" : "light"
    : preference;
}

export function applyTheme(preference) {
  document.documentElement.classList.toggle("dark", resolveTheme(preference) === "dark");
}

/** Reads/writes the theme preference, applying it and re-syncing with the OS when "system". */
export function useThemePreference() {
  const [preference, setPreference] = useState(getStoredThemePreference);

  useEffect(() => {
    applyTheme(preference);
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  return [preference, setPreference];
}
