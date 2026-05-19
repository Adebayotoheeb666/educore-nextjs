"use client";

import { useAppSelector } from "@/redux/hooks";

export default function GlobalLoadingSpinner() {
  const { isLoading, message } = useAppSelector((state) => state.loading);

  if (!isLoading) return null;

  return (
    <div className="global-loading-overlay">
      <div className="global-loading-spinner-container">
        <div className="global-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
}
