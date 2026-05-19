"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import "../../shared.css";

interface Announcement {
  id: string;
  title: string;
  content?: string;
  body?: string;
  target_roles?: string;
  class_name?: string;
  author_name?: string;
  is_pinned?: number | boolean;
  expires_at?: string;
  created_at: string;
}

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/announcements/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItem(d.data ?? null))
      .catch(() => toast.error("Failed to load announcement"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Announcement deleted");
      router.push("/announcements");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!item) return <div className="table-empty">Announcement not found.</div>;

  const body = item.content ?? item.body ?? "";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{item.title}</h1>
          <p>
            {item.author_name && <span>By {item.author_name} · </span>}
            {new Date(item.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            {(item.is_pinned === 1 || item.is_pinned === true) && (
              <span className="badge badge-yellow" style={{ marginLeft: "1rem" }}>Pinned</span>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
          <button className="btn-primary" onClick={handleDelete} disabled={deleting}
            style={{ background: "#ef4444" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="form-card">
        {item.target_roles && (
          <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {item.target_roles.split(",").map((r) => (
              <span key={r} className="badge badge-blue">{r.replace(/_/g, " ")}</span>
            ))}
            {item.class_name && <span className="badge badge-gray">{item.class_name}</span>}
          </div>
        )}

        {item.expires_at && (
          <p style={{ fontSize: "1.3rem", color: "#94a3b8", marginBottom: "2rem" }}>
            Expires: {new Date(item.expires_at).toLocaleDateString("en-NG")}
          </p>
        )}

        <div style={{ fontSize: "1.6rem", color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
