"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { Toaster } from "sonner";
import GlobalLoadingSpinner from "@/components/GlobalLoadingSpinner";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "light");
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
