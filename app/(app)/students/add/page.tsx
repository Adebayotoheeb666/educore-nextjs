"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ClassItem { id: string; name: string; section?: string; }
interface Parent { id: string; name: string; email: string; }

export default function AddStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dob: "", gender: "", classId: "", parentId: "",
    address: "", stateOfOrigin: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      authenticatedFetch("/api/classes").then((r) => r.json()),
      authenticatedFetch("/api/parents").then((r) => r.json()),
    ]).then(([cd, pd]) => {
      setClasses(Array.isArray(cd.data) ? cd.data : []);
      setParents(Array.isArray(pd.data) ? pd.data : []);
    }).catch(() => {});
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
      let avatar: string | null = null;
      if (avatarFile) {
        const reader = new FileReader();
        avatar = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(avatarFile);
        });
      }

      const res = await authenticatedFetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          dob: form.dob || null,
          gender: form.gender || null,
          classId: form.classId || null,
          parentId: form.parentId || null,
          address: form.address || null,
          stateOfOrigin: form.stateOfOrigin || null,
          avatar: avatar || null,
        }),
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
          <div className="form-section-title">Student Photo</div>
          <div style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>Student Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              {avatarFile && (
                <div style={{ marginTop: "0.8rem" }}>
                  <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                    Image selected
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. +234 123 456 7890" />
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

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Parent / Guardian (Optional)</div>
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Link to Registered Parent/Guardian</label>
              <select value={form.parentId} onChange={(e) => set("parentId", e.target.value)}>
                <option value="">Select Parent (optional)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
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
