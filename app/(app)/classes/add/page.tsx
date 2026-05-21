"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Teacher { id: string; name: string; role?: string; }

export default function AddClassPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", section: "", level: "", teacherId: "", capacity: "" });

  useEffect(() => {
    authenticatedFetch("/api/teachers")
      .then((r) => r.json())
      .then((d) => setTeachers(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Class name is required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: form.capacity ? Number(form.capacity) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Class created successfully");
      router.push("/classes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/classes" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Classes
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Create New Class</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>Set up a new class arm with an assigned form teacher.</p>
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
            <Link href="/classes" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
