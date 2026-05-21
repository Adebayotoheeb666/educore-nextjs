"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Subject {
  id: string; name: string; code?: string; category?: string; description?: string;
  is_compulsory?: number; class_name?: string; teacher_names?: string; teacher_ids?: string;
}
interface Teacher { id: string; name: string; role: string; }

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/api/subjects/${id}`).then((r) => r.json()),
      authenticatedFetch("/api/teachers").then((r) => r.json()),
    ]).then(([sd, td]) => {
      setSubject(sd.data ?? null);
      setAllTeachers(Array.isArray(td.data) ? td.data : []);
    }).catch(() => toast.error("Failed to load subject"))
      .finally(() => setLoading(false));
  }, [id]);

  const assignedIds = subject?.teacher_ids?.split(",").filter(Boolean) ?? [];
  const assignedNames = subject?.teacher_names?.split(",").filter(Boolean) ?? [];

  const handleAssign = async () => {
    if (!selectedTeacher) return toast.error("Select a teacher");
    if (assignedIds.includes(selectedTeacher)) return toast.error("Teacher already assigned");
    setAssigning(true);
    try {
      const res = await authenticatedFetch(`/api/subjects/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacher }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Teacher assigned");
      setSelectedTeacher("");
      // Refresh subject
      const sd = await authenticatedFetch(`/api/subjects/${id}`).then((r) => r.json());
      setSubject(sd.data ?? null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (teacherId: string) => {
    try {
      const res = await authenticatedFetch(`/api/subjects/${id}/unassign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Teacher removed");
      const sd = await authenticatedFetch(`/api/subjects/${id}`).then((r) => r.json());
      setSubject(sd.data ?? null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete subject "${subject?.name}"?`)) return;
    try {
      const res = await authenticatedFetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Subject deleted");
      router.push("/subjects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!subject) return <div className="table-empty">Subject not found.</div>;

  const available = allTeachers.filter((t) => !assignedIds.includes(t.id));

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{subject.name}</h1>
          <p>{subject.code && <span style={{ marginRight: "1rem" }}>Code: <strong>{subject.code}</strong></span>}
            {subject.category && <span>Category: {subject.category}</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
          <button className="btn-primary" onClick={handleDelete} style={{ background: "#ef4444" }}>Delete Subject</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
        {/* Subject info */}
        <div className="form-card">
          <div className="form-section-title">Subject Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              ["Class", subject.class_name ?? "All classes"],
              ["Compulsory", subject.is_compulsory ? "Yes" : "No"],
              ["Description", subject.description ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem" }}>{label}</div>
                <div style={{ fontSize: "1.5rem", color: "#334155" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher assignment */}
        <div className="form-card">
          <div className="form-section-title">Assigned Teachers ({assignedIds.length})</div>
          {assignedIds.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "1.4rem", marginBottom: "2rem" }}>No teachers assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {assignedIds.map((tid, i) => (
                <div key={tid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", background: "#f8f7ff", borderRadius: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: "1.4rem" }}>{assignedNames[i] ?? tid}</span>
                  <button
                    onClick={() => handleUnassign(tid)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.3rem", fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {available.length > 0 && (
            <div style={{ display: "flex", gap: "1rem" }}>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{ flex: 1, padding: "0.8rem 1.2rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}
              >
                <option value="">Select teacher to assign</option>
                {available.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.role.replace(/_/g, " ")})</option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleAssign} disabled={assigning || !selectedTeacher}>
                {assigning ? "…" : "Assign"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
