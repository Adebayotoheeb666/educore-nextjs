"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import "../../../shared.css";

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dob: "", gender: "",
    classId: "", parentPhone: "", parentEmail: "", address: "", stateOfOrigin: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/classes", { credentials: "include" }).then((r) => r.json()),
    ]).then(([sd, cd]) => {
      const s = sd.data;
      if (s) {
        const [first, ...rest] = (s.name ?? "").split(" ");
        setForm({
          firstName: s.first_name ?? first ?? "",
          lastName: s.last_name ?? rest.join(" ") ?? "",
          email: s.email ?? "",
          dob: s.dob ? s.dob.slice(0, 10) : "",
          gender: s.gender ?? "",
          classId: s.class_id ?? "",
          parentPhone: s.parent_phone ?? "",
          parentEmail: s.parent_email ?? "",
          address: s.address ?? "",
          stateOfOrigin: s.state_of_origin ?? "",
        });
      }
      setClasses(Array.isArray(cd.data) ? cd.data : []);
    }).catch(() => toast.error("Failed to load student"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          dob: form.dob || null,
          gender: form.gender || null,
          classId: form.classId || null,
          parentPhone: form.parentPhone || null,
          parentEmail: form.parentEmail || null,
          address: form.address || null,
          stateOfOrigin: form.stateOfOrigin || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Student updated");
      router.push(`/students/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Edit Student</h1>
          <p>Update student information.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Parent Phone</label>
              <input type="tel" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Parent Email</label>
              <input type="email" value={form.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} />
            </div>
            <div className="form-group">
              <label>State of Origin</label>
              <input value={form.stateOfOrigin} onChange={(e) => set("stateOfOrigin", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
