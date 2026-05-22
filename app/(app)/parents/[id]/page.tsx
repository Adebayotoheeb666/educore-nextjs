"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Parent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

interface Child {
  id: string;
  name: string;
  admission_no?: string;
}

export default function ParentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      authenticatedFetch(`/api/parents/${id}`).then((r) => r.json()),
      authenticatedFetch(`/api/parents/${id}/children`).then((r) => r.json()),
    ])
      .then(([pd, cd]) => {
        setParent(pd.data);
        setChildren(Array.isArray(cd.data) ? cd.data : []);
      })
      .catch(() => toast.error("Failed to load parent"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this parent? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/parents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Parent deleted");
      router.push("/parents");
    } catch {
      toast.error("Failed to delete parent");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading parent…</div>;
  if (!parent) return <div className="table-empty">Parent not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/parents" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Parents
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", padding: "3rem", marginBottom: "2.5rem", display: "flex", gap: "3rem", alignItems: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #ede9fa" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={parent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(parent.name)}&background=random&size=80`}
            alt=""
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>{parent.name}</h1>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-green">Active</span>
            <span className="mono" style={{ fontSize: "1.2rem", color: "#64748b" }}>{parent.email}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href={`/parents/${id}/edit`} className="btn-outline">✏️ Edit</Link>
          <button className="btn-danger-sm" style={{ padding: "1.1rem 2rem", fontSize: "1.3rem" }} onClick={handleDelete} disabled={deleting}>
            {deleting ? "…" : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="form-card">
        <div className="form-grid-2">
          {[
            { label: "Full Name", value: parent.name },
            { label: "Email", value: parent.email ?? "—" },
            { label: "Phone", value: parent.phone ?? "—" },
            { label: "Registered", value: parent.created_at ? new Date(parent.created_at).toLocaleDateString("en-NG") : "—" },
          ].map((f) => (
            <div key={f.label} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                {f.label}
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "#0f172a" }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Children */}
      <div style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>Linked Children ({children.length})</h2>
        <div className="premium-table-card">
          {children.length === 0 ? (
            <div className="table-empty">No children linked to this parent.</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission No.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="info-cell">
                        <div className="avatar-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`}
                            alt=""
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{c.name}</span>
                      </div>
                    </td>
                    <td><span className="mono">{c.admission_no ?? "—"}</span></td>
                    <td>
                      <Link href={`/students/${c.id}`} className="link-action">View Student</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
