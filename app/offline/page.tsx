"use client";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      padding: "2rem",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        padding: "4rem 3rem",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>📡</div>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
          You're offline
        </h1>
        <p style={{ fontSize: "1.4rem", color: "#64748b", marginBottom: "2.5rem", lineHeight: 1.6 }}>
          It looks like you've lost your internet connection. Some pages may still be
          available from cache — try navigating to a page you've visited recently.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={() => {
              try {
                if (typeof window !== "undefined" && window.location) window.location.reload();
              } catch (err) {
                // ignore
              }
            }}
            style={{
              background: "#6A5ACD",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "1.2rem 2rem",
              fontSize: "1.4rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            style={{
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: 10,
              padding: "1.2rem 2rem",
              fontSize: "1.4rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "block",
            }}
          >
            Go to Dashboard
          </Link>
        </div>
        <p style={{ marginTop: "2rem", fontSize: "1.2rem", color: "#94a3b8" }}>
          EduCore works offline for pages you've already visited.
        </p>
      </div>
    </div>
  );
}
