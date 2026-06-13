"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

// Map database values to user-friendly labels
const EXAM_TYPES = [
  { value: "ca", label: "Continuous Assessment" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
];

interface Exam {
  id: string;
  title: string;
  class_id?: string;
  subject_id?: string;
  type?: string;
  date?: string;
  duration_minutes?: number;
  total_marks?: number;
  instructions?: string;
  term?: string;
  academic_session?: string;
  status?: string;
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;

  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    classId: "",
    subjectId: "",
    type: "ca",
    date: "",
    durationMinutes: "60",
    totalMarks: "100",
    instructions: "",
  });

  useEffect(() => {
    if (!examId) return;

    Promise.all([
      authenticatedFetch("/api/classes").then((r) => r.json()),
      authenticatedFetch("/api/subjects").then((r) => r.json()),
      authenticatedFetch(`/api/exams/${examId}`).then((r) => r.json()),
    ])
      .then(([cd, sd, ed]) => {
        setClasses(Array.isArray(cd.data) ? cd.data : []);
        setSubjects(Array.isArray(sd.data) ? sd.data : []);
        if (ed.data) {
          const exam = ed.data;
          setExam(exam);
          setForm({
            title: exam.title || "",
            classId: exam.class_id || "",
            subjectId: exam.subject_id || "",
            type: exam.type || "ca",
            date: exam.date || "",
            durationMinutes: String(exam.duration_minutes || 60),
            totalMarks: String(exam.total_marks || 100),
            instructions: exam.instructions || "",
          });
        }
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [examId]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return toast.error("Exam title is required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          classId: form.classId || null,
          subjectId: form.subjectId || null,
          type: form.type,
          date: form.date || null,
          durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
          totalMarks: form.totalMarks ? Number(form.totalMarks) : 100,
          instructions: form.instructions || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Exam updated");
      router.push("/exams");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update exam");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="table-empty">Loading exam…</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div>
        <div className="table-empty">Exam not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Edit Exam</h1>
          <p>Update exam details.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exam Title *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. 1st Term Mathematics Exam"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Class</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.section ? ` ${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
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
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={4} />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn-outline" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
