export async function getThemePreference(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { Preferences } = await import("@capacitor/preferences");
    if (Preferences && typeof Preferences.get === "function") {
      const result = await Preferences.get({ key: "theme" });
      if (result?.value) return result.value;
    }
  } catch {
    // Capacitor Preferences may not be available in this runtime.
  }

  try {
    if (typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem("theme");
    }
  } catch {
    // ignore storage access errors
  }

  return null;
}

export async function setThemePreference(theme: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { Preferences } = await import("@capacitor/preferences");
    if (Preferences && typeof Preferences.set === "function") {
      await Preferences.set({ key: "theme", value: theme });
      return;
    }
  } catch {
    // Capacitor Preferences may not be available in this runtime.
  }

  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  } catch {
    // ignore storage access errors
  }
}
