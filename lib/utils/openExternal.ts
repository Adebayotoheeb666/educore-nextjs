// Utility to open external URLs using Capacitor Browser when available,
// falling back to window.open in web environments.
export async function openExternal(url: string) {
  try {
    if (typeof window !== "undefined") {
      // Try dynamic import of Capacitor Browser plugin if available at runtime
      try {
        const mod = await import('@capacitor/browser');
        if (mod && typeof (mod as any).Browser?.open === 'function') {
          await (mod as any).Browser.open({ url });
          return;
        }
      } catch (err) {
        // Capacitor Browser not available or import failed — fallback
      }

      // Fallback to opening a new window/tab
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win && typeof win.focus === 'function') {
        win.focus();
      }
      return;
    }

    throw new Error('Cannot open external URL: no window object');
  } catch (err) {
    throw err;
  }
}
