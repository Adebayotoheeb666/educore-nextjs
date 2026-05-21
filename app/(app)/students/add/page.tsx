"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ClassItem { id: string; name: string; section?: string; }

export default function AddStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    dob: "", gender: "", classId: "",
    parentPhone: "", parentEmail: "",
    address: "", stateOfOrigin: "",
  });

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast.error("First name, last name, and email are required");
    }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(
        `Student added! Admission No: ${data.data?.admissionNo ?? ""} — Default password: ${data.data?.defaultPassword ?? "EduCore@YYYY"}`,
        { duration: 8000 }
      );
      router.push("/students");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/students" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Students
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Add New Student</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Register a student into EduCore. An admission number and default password will be generated automatically.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Student Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Chinelo" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="e.g. Okafor" required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="student@example.com" required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` ${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>State of Origin</label>
              <input value={form.stateOfOrigin} onChange={(e) => set("stateOfOrigin", e.target.value)} placeholder="e.g. Anambra" />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Home address" />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Parent / Guardian Details</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Parent Phone</label>
              <input type="tel" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} placeholder="+234 800 000 0000" />
            </div>
            <div className="form-group">
              <label>Parent Email</label>
              <input type="email" value={form.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} placeholder="parent@example.com" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/students" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding Student…" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
