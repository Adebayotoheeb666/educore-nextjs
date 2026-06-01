"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { Toaster } from "sonner";
import GlobalLoadingSpinner from "@/components/GlobalLoadingSpinner";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const theme = typeof window.localStorage !== "undefined" ? window.localStorage.getItem("theme") : null;
        document.documentElement.setAttribute("data-theme", theme || "light");
      }
    } catch (err) {
      // Ignore storage access errors (e.g., private mode or WebView restrictions)
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && 'serviceWorker' in navigator) {
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
