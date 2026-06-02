// Secure storage wrapper with fallbacks.
// Tries common Capacitor secure storage plugins, then falls back to Preferences, then to localStorage.

export async function setItem(key: string, value: string): Promise<void> {
  // Try community secure storage plugin
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor-community/secure-storage');
    if (mod && (mod as any).SecureStoragePlugin && typeof (mod as any).SecureStoragePlugin.set === 'function') {
      await (mod as any).SecureStoragePlugin.set({ key, value });
      return;
    }
  } catch (e) {}

  // Try another popular plugin interface
  try {
    const mod = await import(/* webpackIgnore: true */ 'capacitor-secure-storage-plugin');
    if (mod && typeof (mod as any).SecureStorage?.set === 'function') {
      await (mod as any).SecureStorage.set(key, value);
      return;
    }
  } catch (e) {}

  // Fallback to Capacitor Preferences if available
  try {
    const { Preferences } = await import('@capacitor/preferences');
    if (Preferences && typeof Preferences.set === 'function') {
      await Preferences.set({ key, value });
      return;
    }
  } catch (e) {}

  // Last-resort fallback to localStorage
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {}

  throw new Error('No suitable storage backend found');
}

export async function getItem(key: string): Promise<string | null> {
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor-community/secure-storage');
    if (mod && (mod as any).SecureStoragePlugin && typeof (mod as any).SecureStoragePlugin.get === 'function') {
      const res = await (mod as any).SecureStoragePlugin.get({ key });
      return res?.value ?? null;
    }
  } catch (e) {}

  try {
    const mod = await import(/* webpackIgnore: true */ 'capacitor-secure-storage-plugin');
    if (mod && typeof (mod as any).SecureStorage?.get === 'function') {
      return await (mod as any).SecureStorage.get(key);
    }
  } catch (e) {}

  try {
    const { Preferences } = await import('@capacitor/preferences');
    if (Preferences && typeof Preferences.get === 'function') {
      const r = await Preferences.get({ key });
      return r.value ?? null;
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage.getItem(key);
    }
  } catch (e) {}

  return null;
}

export async function removeItem(key: string): Promise<void> {
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor-community/secure-storage');
    if (mod && (mod as any).SecureStoragePlugin && typeof (mod as any).SecureStoragePlugin.remove === 'function') {
      await (mod as any).SecureStoragePlugin.remove({ key });
      return;
    }
  } catch (e) {}

  try {
    const mod = await import(/* webpackIgnore: true */ 'capacitor-secure-storage-plugin');
    if (mod && typeof (mod as any).SecureStorage?.remove === 'function') {
      await (mod as any).SecureStorage.remove(key);
      return;
    }
  } catch (e) {}

  try {
    const { Preferences } = await import('@capacitor/preferences');
    if (Preferences && typeof Preferences.remove === 'function') {
      await Preferences.remove({ key });
      return;
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (e) {}

  // nothing else to do
}
