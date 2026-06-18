"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getThemePreference, setThemePreference } from "@/lib/utils/themeStorage";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  mounted: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await getThemePreference();
        const initial: Theme = saved === "dark" ? "dark" : "light";
        setThemeState(initial);
        applyTheme(initial);
      } catch {
        setThemeState("light");
        applyTheme("light");
      } finally {
        setMounted(true);
      }
    };
    init();
  }, []);

  const setTheme = useCallback(async (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      await setThemePreference(next);
    } catch {
      // Ignore storage errors in restrictive WebViews
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      mounted,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme, mounted, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
