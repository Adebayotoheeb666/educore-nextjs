"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

// Map database values to user-friendly labels
const EXAM_TYPES = [
  { value: "ca", label: "Continuous Assessment" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
];

export default function CreateExamPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", classId: "", subjectId: "", type: "ca",
    date: "", durationMinutes: "60", totalMarks: "100",
    term: "", session: "", instructions: "",
  });

  useEffect(() => {
    Promise.all([
      authenticatedFetch("/api/classes").then((r) => r.json()),
      authenticatedFetch("/api/subjects").then((r) => r.json()),
    ]).then(([cd, sd]) => {
      setClasses(Array.isArray(cd.data) ? cd.data : []);
      setSubjects(Array.isArray(sd.data) ? sd.data : []);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return toast.error("Exam title is required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          classId: form.classId || null,
          subjectId: form.subjectId || null,
          type: form.type,
          date: form.date || null,
          durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
          totalMarks: form.totalMarks ? Number(form.totalMarks) : 100,
          term: form.term || null,
          session: form.session || null,
          instructions: form.instructions || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Exam created");
      router.push("/exams");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Create Exam</h1>
          <p>Schedule a new exam or assessment.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exam Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 1st Term Mathematics Exam" required />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Class</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} min="10" />
            </div>
            <div className="form-group">
              <label>Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={(e) => set("totalMarks", e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label>Term</label>
              <select value={form.term} onChange={(e) => set("term", e.target.value)}>
                <option value="">Current term</option>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>
            <div className="form-group">
              <label>Academic Session</label>
              <input value={form.session} onChange={(e) => set("session", e.target.value)} placeholder="e.g. 2024/2025" />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={3} placeholder="Answer all questions in section A…" style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Exam"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
