"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ClassDetail {
  id: string;
  name: string;
  section?: string;
  level?: string;
  class_teacher_id?: string;
  teacher_name?: string;
  teacher_email?: string;
  capacity?: number;
  created_at?: string;
  updated_at?: string;
  students?: Array<{ id: string; name: string; admission_no?: string; avatar?: string }>;
  subjects?: Array<{ id: string; name: string; code?: string }>;
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authenticatedFetch(`/api/classes/${id}`)
      .then((r) => r.json())
      .then((d) => setClassData(d.data ?? null))
      .catch(() => toast.error("Failed to load class"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Delete class "${classData?.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Class deleted");
      router.push("/classes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!classData) return <div className="table-empty">Class not found.</div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{classData.name}</h1>
          <p>{classData.level && <span style={{ marginRight: "1rem" }}>Level: <strong>{classData.level}</strong></span>}
            {classData.section && <span>Section: {classData.section}</span>}
          </p>
        </div>
        <div className="header-actions">
          <Link href={`/classes/${id}/edit`} className="btn-outline">✏️ Edit</Link>
          <button className="btn-primary" onClick={handleDelete} disabled={deleting}
            style={{ background: "#ef4444" }}>
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* Class info */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", padding: "3rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          {[
            ["Form Teacher", classData.teacher_name ?? "—"],
            ["Email", classData.teacher_email ?? "—"],
            ["Section", classData.section ?? "—"],
            ["Level", classData.level ?? "—"],
            ["Capacity", classData.capacity ?? "—"],
            ["Created", classData.created_at ? new Date(classData.created_at).toLocaleDateString("en-NG") : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#334155" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Students */}
      <div className="form-card">
        <div className="form-section-title">Students ({(classData.students ?? []).length})</div>
        {(classData.students ?? []).length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No students in this class yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {classData.students?.map((s) => (
              <div key={s.id} style={{ padding: "1rem", background: "#f8f7ff", borderRadius: 10, border: "1px solid #ede9fa" }}>
                <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.5rem" }}>{s.name}</div>
                {s.admission_no && <div style={{ fontSize: "1.2rem", color: "#94a3b8" }}>{s.admission_no}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subjects */}
      <div className="form-card">
        <div className="form-section-title">Subjects ({(classData.subjects ?? []).length})</div>
        {(classData.subjects ?? []).length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No subjects assigned to this class yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {classData.subjects?.map((s) => (
              <div key={s.id} style={{ background: "#f8f7ff", border: "1px solid #ede9fa", borderRadius: 10, padding: "1rem 1.8rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>{s.name}</div>
                {s.code && <div style={{ fontSize: "1.2rem", color: "#94a3b8" }}>{s.code}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
