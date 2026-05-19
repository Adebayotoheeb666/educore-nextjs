"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { Toaster } from "sonner";
import GlobalLoadingSpinner from "@/components/GlobalLoadingSpinner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <GlobalLoadingSpinner />
      <Toaster position="top-right" richColors closeButton />
    </Provider>
  );
}
