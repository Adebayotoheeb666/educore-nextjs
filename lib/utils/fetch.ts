import { resolveApiUrl } from "@/lib/utils/runtimeConfig";
import { getAuthToken as getStoredAuthToken } from "@/lib/utils/authStorage";

export async function getAuthToken(): Promise<string | null> {
  return await getStoredAuthToken();
}

// Enhanced fetch that automatically includes the auth token from browser storage
// and resolves `/api/*` requests to a mobile API base URL when configured.
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const newOptions: RequestInit = {
    ...options,
    credentials: "include", // Always include cookies for httpOnly token
  };

  const resolvedUrl = url.startsWith("/api") ? resolveApiUrl(url) : url;
  const token = await getAuthToken();

  if (token) {
    newOptions.headers = new Headers(options?.headers);
    (newOptions.headers as Headers).set("Authorization", `Bearer ${token}`);
  }

  return fetch(resolvedUrl, newOptions);
}

export function installMobileFetchInterceptor(): void {
  if (typeof window === "undefined") return;
  if ((window as any).__EDUCORE_MOBILE_FETCH_INSTALLED__) return;

  const originalFetch = (window as any).fetch?.bind(window) ?? (() => Promise.reject(new Error('fetch not available')));
  (window as any).__EDUCORE_MOBILE_FETCH_INSTALLED__ = true;

  (window as any).fetch = async (input: any, init?: any) => {
    let url = typeof input === "string" ? input : input?.url;
    const isApiRequest = typeof url === "string" ? url.startsWith("/api") : false;

    if (isApiRequest) {
      url = resolveApiUrl(url as string);
    }

    const token = await getAuthToken();
    const originalHeaders = new Headers(
      init?.headers ?? (typeof input !== "string" ? input.headers : undefined)
    );

    if (token) {
      originalHeaders.set("Authorization", `Bearer ${token}`);
    }

    const mergedInit: RequestInit = {
      ...init,
      headers: originalHeaders,
      credentials: isApiRequest ? (init?.credentials ?? "include") : init?.credentials,
    };

    if (input instanceof Request) {
      const request = new Request(url, {
        ...mergedInit,
        method: mergedInit.method ?? input.method,
        body: mergedInit.body ?? input.body,
        mode: mergedInit.mode ?? input.mode,
        cache: mergedInit.cache ?? input.cache,
        redirect: mergedInit.redirect ?? input.redirect,
        referrer: mergedInit.referrer ?? input.referrer,
        referrerPolicy: mergedInit.referrerPolicy ?? input.referrerPolicy,
        integrity: mergedInit.integrity ?? input.integrity,
        keepalive: mergedInit.keepalive ?? input.keepalive,
        signal: mergedInit.signal ?? input.signal,
      });
      return originalFetch(request as any);
    }

    return originalFetch(url, mergedInit as any);
  };
}
