"use client";

import { RiMoonLine, RiSunLine } from "react-icons/ri";
import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  className?: string;
  size?: number;
};

export default function ThemeToggle({ className = "theme-toggle", size = 20 }: ThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button type="button" className={className} aria-label="Toggle theme" disabled>
        <RiMoonLine size={size} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <RiSunLine size={size} /> : <RiMoonLine size={size} />}
    </button>
  );
}
