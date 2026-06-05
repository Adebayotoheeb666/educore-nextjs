"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { Toaster } from "sonner";
import GlobalLoadingSpinner from "@/components/GlobalLoadingSpinner";
import { useEffect } from "react";
import { installMobileFetchInterceptor } from "@/lib/utils/fetch";
import { IS_MOBILE_WEBVIEW } from "@/lib/utils/runtimeConfig";
import { getThemePreference } from "@/lib/utils/themeStorage";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installMobileFetchInterceptor();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fixInvalidResources = () => {
      document.querySelectorAll('[href="undefined"], [href="/undefined"], [src="undefined"], [src="/undefined"]').forEach((el) => {
        try {
          console.warn("[client-guard] invalid resource URL found", el);
          if (el.hasAttribute("href")) el.removeAttribute("href");
          if (el.hasAttribute("src")) el.removeAttribute("src");
          (el as any).dataset.invalidUrl = "true";
          if (el instanceof HTMLElement) el.classList.add("bad-href");
        } catch {
          // ignore
        }
      });
    };
    fixInvalidResources();
    const mo = new MutationObserver(fixInvalidResources);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (typeof document !== "undefined") {
          const theme = await getThemePreference();
          document.documentElement.setAttribute("data-theme", theme || "light");
        }
      } catch {
        // Ignore storage access errors (e.g., private mode or WebView restrictions)
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    try {
      if (!IS_MOBILE_WEBVIEW && typeof navigator !== "undefined" && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // eslint-disable-next-line no-console
            console.log('Service worker registered:', reg.scope);
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Service worker registration failed:', err);
          });
      }
    } catch (err) {
      // Service worker registration may fail in some WebViews
    }
  }, []);

  return (
    <Provider store={store}>
      <GlobalLoadingSpinner />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </Provider>
  );
}
