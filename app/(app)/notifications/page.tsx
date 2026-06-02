"use client";
import { useEffect, useState } from "react";
import "../shared.css";
import { authenticatedFetch } from "@/lib/utils/fetch";

interface Notification {
  id: string;
  title: string;
  body?: string;
  type?: string;
  is_pinned?: number;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  announcement: "📣",
  activity: "⚡",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-NG");
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "announcement" | "activity">("all");

  useEffect(() => {
    authenticatedFetch("/api/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === "all" ? items : items.filter((n) => n.type === filter);
  const counts = {
    all: items.length,
    announcement: items.filter((n) => n.type === "announcement").length,
    activity: items.filter((n) => n.type === "activity").length,
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Notifications</h1>
          <p>System alerts, announcements, and activity updates.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "2rem" }}>
        {(["all", "announcement", "activity"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.8rem 1.8rem",
              borderRadius: 8,
              border: "1px solid",
              fontSize: "1.3rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filter === f ? "#6A5ACD" : "white",
              color: filter === f ? "white" : "#475569",
              borderColor: filter === f ? "#6A5ACD" : "#e2e8f0",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            <span style={{ opacity: 0.7 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-empty">Loading notifications…</div>
      ) : visible.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "6rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🔔</div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "1rem" }}>All caught up!</h2>
          <p style={{ fontSize: "1.5rem" }}>You have no notifications in this category.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {visible.map((n) => (
            <div
              key={n.id}
              style={{
                background: n.is_pinned ? "#f5f3ff" : "white",
                borderRadius: 14,
                border: `1px solid ${n.is_pinned ? "#c4b5fd" : "#f1f5f9"}`,
                padding: "2rem 2.5rem",
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "2.4rem", lineHeight: 1, marginTop: "0.2rem" }}>
                {n.is_pinned ? "📌" : (TYPE_ICON[n.type ?? ""] ?? "🔔")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{n.title}</h4>
                  <span style={{ fontSize: "1.2rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <p style={{ fontSize: "1.3rem", color: "#64748b", marginTop: "0.5rem", marginBottom: 0 }}>
                    {n.body}
                  </p>
                )}
                {n.type && (
                  <span style={{
                    display: "inline-block",
                    marginTop: "0.8rem",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: n.type === "announcement" ? "#7c3aed" : "#0284c7",
                    background: n.type === "announcement" ? "#ede9fe" : "#e0f2fe",
                    borderRadius: 6,
                    padding: "0.2rem 0.8rem",
                    textTransform: "capitalize",
                  }}>
                    {n.type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
