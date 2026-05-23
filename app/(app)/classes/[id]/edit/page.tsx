"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Teacher { id: string; name: string; role?: string; }
interface ClassDetail {
  id: string;
  name: string;
  section?: string;
  level?: string;
  class_teacher_id?: string;
  teacher_name?: string;
  capacity?: number;
}

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", section: "", level: "", teacherId: "", capacity: "" });

  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/api/classes/${id}`).then((r) => r.json()),
      authenticatedFetch("/api/teachers").then((r) => r.json()),
    ]).then(([cd, td]) => {
      const classInfo = cd.data;
      setClassData(classInfo);
      setForm({
        name: classInfo.name || "",
        section: classInfo.section || "",
        level: classInfo.level || "",
        teacherId: classInfo.class_teacher_id || "",
        capacity: classInfo.capacity?.toString() || "",
      });
      setTeachers(Array.isArray(td.data) ? td.data : []);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Class name is required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          arm: form.section || null,
          level: form.level || null,
          classTeacher: form.teacherId || null,
          capacity: form.capacity ? Number(form.capacity) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Class updated successfully");
      router.push(`/classes/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update class");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!classData) return <div className="table-empty">Class not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href={`/classes/${id}`} style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Class
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Edit Class</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>Update class details and form teacher assignment.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Class Details</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Class Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. JSS 1, SS 2" required />
            </div>
            <div className="form-group">
              <label>Section / Arm</label>
              <input value={form.section} onChange={(e) => set("section", e.target.value)} placeholder="e.g. A, B, Gold" />
            </div>
            <div className="form-group">
              <label>Level</label>
              <select value={form.level} onChange={(e) => set("level", e.target.value)}>
                <option value="">Select Level</option>
                <option value="Primary">Primary</option>
                <option value="JSS">Junior Secondary (JSS)</option>
                <option value="SSS">Senior Secondary (SSS)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Form Teacher</label>
              <select value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
                <option value="">Select Form Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Student Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="e.g. 40" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href={`/classes/${id}`} className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Updating…" : "Update Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
