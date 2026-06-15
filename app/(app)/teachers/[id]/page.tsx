"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Teacher {
  id: string; name: string; email: string; role: string;
  phone?: string; is_active?: number; created_at: string;
  avatar?: string; admission_no?: string;
}

interface Subject { id: string; name: string; code?: string; class_name?: string; }

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/api/teachers/${id}`).then((r) => r.json()),
      authenticatedFetch(`/api/subjects?teacherId=${id}`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([td, sd]) => {
      setTeacher(td.data ?? null);
      setSubjects(Array.isArray(sd.data) ? sd.data : []);
    }).catch(() => toast.error("Failed to load teacher"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemove = async () => {
    if (!confirm(`Remove ${teacher?.name} from the system?`)) return;
    setRemoving(true);
    try {
      const res = await authenticatedFetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Teacher removed");
      router.push("/teachers");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
      setRemoving(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!teacher) return <div className="table-empty">Teacher not found.</div>;

  const initials = teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{teacher.name}</h1>
          <p>{teacher.role.replace(/_/g, " ")}</p>
        </div>
        <div className="header-actions">
          <Link href={`/teachers/${id}/edit`} className="btn-outline">✏️ Edit</Link>
          <button className="btn-primary" onClick={handleRemove} disabled={removing}
            style={{ background: "#ef4444" }}>
            {removing ? "Removing…" : "🗑 Remove"}
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", padding: "3rem", marginBottom: "2.5rem", display: "flex", gap: "2.5rem", alignItems: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #ede9fa" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teacher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random&size=80`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
          {[
            ["Email", teacher.email],
            ["Phone", teacher.phone ?? "—"],
            ["Role", teacher.role.replace(/_/g, " ")],
            ["Status", teacher.is_active ? "Active" : "Inactive"],
            ["Joined", new Date(teacher.created_at).toLocaleDateString("en-NG")],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#334155" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned subjects */}
      <div className="form-card">
        <div className="form-section-title">Assigned Subjects ({subjects.length})</div>
        {subjects.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No subjects assigned yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {subjects.map((s) => (
              <div key={s.id} style={{ background: "#f8f7ff", border: "1px solid #ede9fa", borderRadius: 10, padding: "1rem 1.8rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>
                  {s.name}
                  {s.code && <span style={{ color: "#94a3b8", fontSize: "1.2rem", marginLeft: "0.5rem" }}>({s.code})</span>}
                </div>
                {s.class_name && <div style={{ fontSize: "1.2rem", color: "#94a3b8" }}>{s.class_name}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
