"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Class {
  id: string;
  name: string;
  level: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  class_id?: string;
  class_name?: string;
  is_compulsory?: number;
  description?: string;
}

export default function EditSubjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    classId: "",
    isCompulsory: true,
    description: "",
  });

  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/api/subjects/${id}`).then((r) => r.json()),
      authenticatedFetch("/api/classes").then((r) => r.json()),
    ])
      .then(([sd, cd]) => {
        const subj = sd.data;
        setSubject(subj);
        setClasses(Array.isArray(cd.data) ? cd.data : []);
        setForm({
          name: subj.name || "",
          code: subj.code || "",
          classId: subj.class_id || "",
          isCompulsory: subj.is_compulsory ? true : false,
          description: subj.description || "",
        });
      })
      .catch(() => toast.error("Failed to load subject"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Subject name is required");

    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code || null,
          classId: form.classId || null,
          isCompulsory: form.isCompulsory,
          description: form.description || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Subject updated");
      router.push(`/subjects/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update subject");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!subject) return <div className="table-empty">Subject not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link
          href={`/subjects/${id}`}
          style={{
            textDecoration: "none",
            color: "#64748b",
            fontSize: "1.4rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
        >
          ← Back to Subject
        </Link>
      </div>

      <div className="form-card">
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "2rem" }}>Edit Subject</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g., MTH101"
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.isCompulsory}
                onChange={(e) => set("isCompulsory", e.target.checked)}
              />
              Compulsory subject
            </label>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Subject description"
              rows={4}
            />
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href={`/subjects/${id}`} className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
