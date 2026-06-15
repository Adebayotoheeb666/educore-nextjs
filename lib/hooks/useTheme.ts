"use client";

import { useEffect, useState } from "react";
import { getThemePreference, setThemePreference } from "@/lib/utils/themeStorage";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const preference = await getThemePreference();
        const initialTheme = (preference as Theme) || "light";
        setTheme(initialTheme);
        applyTheme(initialTheme);
      } catch {
        setTheme("light");
        applyTheme("light");
      } finally {
        setMounted(true);
      }
    };

    initTheme();
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = async () => {
    if (!theme || !mounted) return;
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    await setThemePreference(newTheme);
  };

  return {
    theme,
    mounted,
    toggleTheme,
    setTheme: async (newTheme: Theme) => {
      setTheme(newTheme);
      applyTheme(newTheme);
      await setThemePreference(newTheme);
    },
  };
}
