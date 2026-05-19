"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "../../shared.css";

export default function GenerateLessonPlanPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<string>("");
  const [form, setForm] = useState({ classId: "", subjectId: "", topic: "", week: "", duration: "40" });

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

  const selectedClass = classes.find((c) => c.id === form.classId);
  const selectedSubject = subjects.find((s) => s.id === form.subjectId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.classId || !form.subjectId) {
      return toast.error("Topic, class, and subject are required");
    }
    setGenerating(true);
    setGenerated("");
    try {
      const prompt = `Generate a detailed Nigerian school lesson plan for:
- Class: ${selectedClass?.name}${selectedClass?.section ? " " + selectedClass.section : ""}
- Subject: ${selectedSubject?.name}
- Topic: ${form.topic}
- Duration: ${form.duration} minutes
- Week: ${form.week || "unspecified"}

Format the lesson plan with these sections:
1. Learning Objectives (3-5 specific, measurable objectives)
2. Entry Behaviour (prerequisite knowledge)
3. Instructional Materials / Resources
4. Introduction / Set Induction (5 minutes)
5. Presentation / Development (step-by-step teaching activities)
6. Class Activity / Student Practice
7. Summary / Closure
8. Evaluation / Assessment
9. Assignment / Homework

Write in a clear, professional tone suitable for a Nigerian secondary school teacher.`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, type: "lesson_plan" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGenerated(data.data?.result ?? "");
      toast.success("Lesson plan generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `${selectedSubject?.name ?? "Lesson"} — ${form.topic}`,
          classId: form.classId,
          subjectId: form.subjectId,
          topic: form.topic,
          week: form.week ? Number(form.week) : null,
          duration: Number(form.duration),
          activities: generated,
          is_ai_generated: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Saved to lesson plans!");
      router.push("/lesson-plans");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>AI Lesson Plan Generator</h1>
          <p>Describe your lesson and let AI draft a complete plan.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.push("/lesson-plans/create")}>
            Write Manually
          </button>
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: "3rem" }}>
        <div className="form-section-title">Lesson Details</div>
        <form onSubmit={handleGenerate}>
          <div className="form-grid-2">
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
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Topic *</label>
              <input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="e.g. Photosynthesis in green plants" required />
            </div>
            <div className="form-group">
              <label>Week</label>
              <input type="number" value={form.week} onChange={(e) => set("week", e.target.value)} placeholder="e.g. 5" min="1" max="15" />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} min="20" max="180" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={generating}>
            {generating ? "Generating…" : "✨ Generate with AI"}
          </button>
        </form>
      </div>

      {generating && (
        <div style={{ textAlign: "center", padding: "4rem", color: "#6A5ACD", fontSize: "1.6rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>✨</div>
          AI is writing your lesson plan…
        </div>
      )}

      {generated && (
        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div className="form-section-title" style={{ margin: 0 }}>Generated Lesson Plan</div>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "💾 Save to My Plans"}
            </button>
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "2.5rem", fontSize: "1.4rem", lineHeight: 1.9, whiteSpace: "pre-wrap", color: "#334155", maxHeight: "60rem", overflowY: "auto" }}>
            {generated}
          </div>
        </div>
      )}
    </div>
  );
}
