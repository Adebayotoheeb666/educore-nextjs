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
