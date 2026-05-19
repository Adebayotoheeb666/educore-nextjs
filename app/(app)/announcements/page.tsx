"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import "../shared.css";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  is_pinned?: number;
  target_roles?: string;
  created_at: string;
  expires_at?: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Announcements</h1>
          <p>Broadcast messages and updates to staff, teachers, parents, and students.</p>
        </div>
        <div className="header-actions">
          <Link href="/announcements/create" className="btn-primary">
            <span>+</span> New Announcement
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading announcements…</div>
      ) : items.length === 0 ? (
        <div className="premium-table-card">
          <div className="table-empty">No announcements yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                background: "white",
                border: "1px solid #f1f5f9",
                borderLeft: a.is_pinned ? "4px solid #6A5ACD" : "4px solid transparent",
                borderRadius: 16,
                padding: "2.5rem 3rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {!!a.is_pinned && <span className="badge badge-green">📌 Pinned</span>}
                  <h3 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>{a.title}</h3>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem", color: "#94a3b8" }}>
                    {new Date(a.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link href={`/announcements/${a.id}`} className="link-action">View</Link>
                </div>
              </div>
              <p style={{ fontSize: "1.4rem", color: "#475569", margin: 0, lineHeight: 1.6 }}>
                {a.content.length > 200 ? `${a.content.slice(0, 200)}…` : a.content}
              </p>
              <div style={{ marginTop: "1.2rem", display: "flex", gap: "1.5rem", fontSize: "1.2rem", color: "#94a3b8" }}>
                {a.author_name && <span>By {a.author_name}</span>}
                {a.target_roles && <span>→ {a.target_roles}</span>}
                {a.expires_at && (
                  <span style={{ color: new Date(a.expires_at) < new Date() ? "#ef4444" : "#94a3b8" }}>
                    Expires {new Date(a.expires_at).toLocaleDateString("en-NG")}
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
