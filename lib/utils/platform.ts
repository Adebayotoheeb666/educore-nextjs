// Platform detection helpers for runtime branching between web and native (Capacitor)
export function isCapacitorAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined';
  } catch (e) {
    return false;
  }
}

export function isNative(): boolean {
  try {
    if (!isCapacitorAvailable()) return false;
    const Capacitor = (window as any).Capacitor;
    // Capacitor has a platform getter; web returns 'web'
    const platform = typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : Capacitor.platform || 'web';
    return platform !== 'web';
  } catch (e) {
    return false;
  }
}

export function platformName(): string {
  try {
    if (!isCapacitorAvailable()) return 'web';
    const Capacitor = (window as any).Capacitor;
    return typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : Capacitor.platform || 'web';
  } catch (e) {
    return 'web';
  }
}
