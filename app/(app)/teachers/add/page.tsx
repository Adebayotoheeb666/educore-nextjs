"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "../../shared.css";

const ROLES = [
  { value: "subject_teacher", label: "Subject Teacher" },
  { value: "class_teacher",   label: "Class Teacher" },
  { value: "vp_academics",   label: "VP Academics" },
  { value: "vp_admin",       label: "VP Admin" },
  { value: "principal",      label: "Principal" },
  { value: "bursar",         label: "Bursar" },
  { value: "librarian",      label: "Librarian" },
  { value: "admin_staff",    label: "Admin Staff" },
];

export default function AddTeacherPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    role: "subject_teacher", qualification: "", specialization: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast.error("First name, last name, and email are required");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(
        `Teacher added! Default password: ${data.data?.defaultPassword ?? "EduCore@YYYY"}`,
        { duration: 8000 }
      );
      router.push("/teachers");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/teachers" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Teachers
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Add New Teacher</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Register a new staff member. A default password will be generated automatically.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Personal Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Amaka" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="e.g. Eze" required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="teacher@school.ng" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Role & Qualification</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Highest Qualification</label>
              <input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. B.Ed Mathematics" />
            </div>
            <div className="form-group">
              <label>Specialization / Subject</label>
              <input value={form.specialization} onChange={(e) => set("specialization", e.target.value)} placeholder="e.g. Mathematics, English" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/teachers" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding Teacher…" : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
