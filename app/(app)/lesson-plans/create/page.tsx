"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "../../shared.css";

export default function CreateLessonPlanPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", classId: "", subjectId: "", topic: "", week: "", term: "",
    objectives: "", activities: "", resources: "", assessment: "", duration: "40",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/classes", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/subjects", { credentials: "include" }).then((r) => r.json()),
    ]).then(([cd, sd]) => {
      setClasses(Array.isArray(cd.data) ? cd.data : []);
      setSubjects(Array.isArray(sd.data) ? sd.data : []);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId) {
      return toast.error("Title, class, and subject are required");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          classId: form.classId,
          subjectId: form.subjectId,
          topic: form.topic,
          week: form.week ? Number(form.week) : null,
          term: form.term || null,
          objectives: form.objectives,
          activities: form.activities,
          resources: form.resources,
          assessment: form.assessment,
          duration: form.duration ? Number(form.duration) : 40,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Lesson plan created");
      router.push("/lesson-plans");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Create Lesson Plan</h1>
          <p>Write a structured lesson plan for your class.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.push("/lesson-plans/generate")}>
            ✨ Generate with AI
          </button>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Introduction to Fractions" required />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Specific topic within the lesson" />
            </div>
            <div className="form-group">
              <label>Class *</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)} required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)} required>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Week</label>
              <input type="number" value={form.week} onChange={(e) => set("week", e.target.value)} placeholder="e.g. 3" min="1" max="15" />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} min="20" max="180" />
            </div>
          </div>

          <div className="form-group">
            <label>Learning Objectives</label>
            <textarea value={form.objectives} onChange={(e) => set("objectives", e.target.value)} rows={3} placeholder="By the end of this lesson, students will be able to…" style={{ resize: "vertical" }} />
          </div>
          <div className="form-group">
            <label>Activities / Procedure</label>
            <textarea value={form.activities} onChange={(e) => set("activities", e.target.value)} rows={4} placeholder="Introduction, main activity, class work…" style={{ resize: "vertical" }} />
          </div>
          <div className="form-group">
            <label>Resources / Materials</label>
            <textarea value={form.resources} onChange={(e) => set("resources", e.target.value)} rows={2} placeholder="Textbook, charts, projector…" style={{ resize: "vertical" }} />
          </div>
          <div className="form-group">
            <label>Assessment / Evaluation</label>
            <textarea value={form.assessment} onChange={(e) => set("assessment", e.target.value)} rows={2} placeholder="Oral questions, assignment, quiz…" style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save Lesson Plan"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
