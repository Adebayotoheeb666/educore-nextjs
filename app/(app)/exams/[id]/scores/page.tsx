"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Exam {
  id: string; title: string; class_id?: string; class_name?: string;
  subject_name?: string; total_marks?: number; type?: string; date?: string;
}
interface Student { id: string; name: string; admission_no?: string; }
interface Score { studentId: string; score: string; remark?: string; }

export default function ExamScoresPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authenticatedFetch(`/api/exams/${id}`)
      .then((r) => r.json())
      .then(async (d) => {
        const examData = d.data as Exam;
        setExam(examData);

        if (examData.class_id) {
          const sd = await authenticatedFetch(`/api/students?classId=${examData.class_id}`).then((r) => r.json());
          const list: Student[] = Array.isArray(sd.data) ? sd.data : sd.data?.students ?? [];
          setStudents(list);
          const init: Record<string, Score> = {};
          list.forEach((s) => { init[s.id] = { studentId: s.id, score: "", remark: "" }; });
          setScores(init);
        }
      })
      .catch(() => toast.error("Failed to load exam"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries = Object.values(scores)
      .filter((s) => s.score !== "")
      .map((s) => ({
        studentId: s.studentId,
        score: Number(s.score),
        remark: s.remark,
      }));

    if (entries.length === 0) return toast.error("Enter at least one score");
    setSaving(true);
    try {
      const res = await authenticatedFetch(`/api/exams/${id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: entries }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(`${entries.length} scores saved`);
      router.push("/exams");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!exam) return <div className="table-empty">Exam not found.</div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Enter Scores</h1>
          <p>{exam.title} · {exam.class_name} · {exam.subject_name}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2rem 3rem", marginBottom: "3rem", display: "flex", gap: "4rem", fontSize: "1.4rem" }}>
        <div><span style={{ color: "#64748b" }}>Type:</span> <strong>{exam.type ?? "—"}</strong></div>
        <div><span style={{ color: "#64748b" }}>Total Marks:</span> <strong>{exam.total_marks ?? 100}</strong></div>
        <div><span style={{ color: "#64748b" }}>Date:</span> <strong>{exam.date ? new Date(exam.date).toLocaleDateString("en-NG") : "—"}</strong></div>
      </div>

      {students.length === 0 ? (
        <div className="table-empty">No students in this class or class not set for this exam.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="premium-table-card">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student Name</th>
                  <th>Score (out of {exam.total_marks ?? 100})</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: "#94a3b8", fontFamily: "monospace" }}>{s.admission_no ?? "—"}</td>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>
                      <input
                        type="number"
                        value={scores[s.id]?.score ?? ""}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [s.id]: { ...prev[s.id], studentId: s.id, score: e.target.value },
                        }))}
                        min="0"
                        max={exam.total_marks ?? 100}
                        placeholder="—"
                        style={{ width: 90, padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}
                      />
                    </td>
                    <td>
                      <input
                        value={scores[s.id]?.remark ?? ""}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [s.id]: { ...prev[s.id], remark: e.target.value },
                        }))}
                        placeholder="Optional remark"
                        style={{ width: 200, padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save All Scores"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
