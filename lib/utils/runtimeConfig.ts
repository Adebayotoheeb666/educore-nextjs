export const MOBILE_API_BASE_URL =
  process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "";

export const IS_MOBILE_WEBVIEW = typeof window !== "undefined" &&
  typeof (window as any).Capacitor !== "undefined" &&
  (typeof (window as any).Capacitor.getPlatform === "function"
    ? (window as any).Capacitor.getPlatform() !== "web"
    : (window as any).Capacitor.platform !== "web");

export function resolveApiUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!path.startsWith("/api")) return path;

  const base = MOBILE_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}
