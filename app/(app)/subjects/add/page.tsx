"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

export default function AddSubjectPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      return toast.error("Subject name is required");
    }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Subject created successfully");
      router.push("/subjects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/subjects" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Subjects
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Add New Subject</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Create a new subject for your school curriculum.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Subject Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Subject Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mathematics" required />
            </div>
            <div className="form-group">
              <label>Subject Code</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="e.g. MTH101" />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the subject" style={{ minHeight: "120px" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/subjects" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating Subject…" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
