"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface Result {
  student_name: string;
  admission_no?: string;
  subject_name: string;
  score?: number;
  grade?: string;
  term: string;
}

export default function BroadsheetPage() {

  const [results, setResults] = useState<Result[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const loadResults = () => {
    if (!classId) return toast.error("Select a class");
    setLoading(true);
    const params = new URLSearchParams({ classId });
    if (term) params.set("term", term);
    authenticatedFetch(`/api/results?${params}`)
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  };

  // Build cross-tabulated structure: student → subject → score
  const { students, subjects, grid } = useMemo(() => {
    const studentMap = new Map<string, string>(); // name → admissionNo
    const subjectSet = new Set<string>();
    const gridMap = new Map<string, Map<string, { score?: number; grade?: string }>>();

    results.forEach((r) => {
      studentMap.set(r.student_name, r.admission_no ?? "");
      subjectSet.add(r.subject_name);
      if (!gridMap.has(r.student_name)) gridMap.set(r.student_name, new Map());
      gridMap.get(r.student_name)!.set(r.subject_name, { score: r.score, grade: r.grade });
    });

    const studentList = Array.from(studentMap.keys()).sort();
    const subjectList = Array.from(subjectSet).sort();
    return { students: studentList, subjects: subjectList, grid: gridMap };
  }, [results]);

  const gradeColor = (grade?: string) => {
    if (!grade) return "#94a3b8";
    if (["A", "A+", "A1"].includes(grade)) return "#22c55e";
    if (grade.startsWith("B")) return "#3b82f6";
    if (grade.startsWith("C")) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Broadsheet</h1>
          <p>Cross-subject results summary for a class and term.</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: "3rem" }}>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ minWidth: 200 }}>
          <option value="">Select class *</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
          ))}
        </select>
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">All terms</option>
          <option value="1st Term">1st Term</option>
          <option value="2nd Term">2nd Term</option>
          <option value="3rd Term">3rd Term</option>
        </select>
        <button className="btn-primary" onClick={loadResults} disabled={loading || !classId}>
          {loading ? "Loading…" : "Generate Broadsheet"}
        </button>
      </div>

      {students.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9", fontSize: "1.3rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "1.5rem 2rem", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #f1f5f9", minWidth: 180 }}>Student</th>
                <th style={{ padding: "1.5rem", textAlign: "center", fontWeight: 700, color: "#475569", borderBottom: "1px solid #f1f5f9", minWidth: 60, whiteSpace: "nowrap" }}>Adm. No.</th>
                {subjects.map((subj) => (
                  <th key={subj} style={{ padding: "1.5rem 1rem", textAlign: "center", fontWeight: 700, color: "#475569", borderBottom: "1px solid #f1f5f9", minWidth: 90, whiteSpace: "nowrap" }}>
                    {subj}
                  </th>
                ))}
                <th style={{ padding: "1.5rem", textAlign: "center", fontWeight: 700, color: "#6A5ACD", borderBottom: "1px solid #f1f5f9", minWidth: 80 }}>Avg.</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => {
                const row = grid.get(student);
                const scores = subjects.map((s) => row?.get(s)?.score).filter((v): v is number => v != null);
                const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
                return (
                  <tr key={student} style={{ background: i % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1.2rem 2rem", fontWeight: 700 }}>{student}</td>
                    <td style={{ padding: "1.2rem", textAlign: "center", color: "#94a3b8", fontFamily: "monospace", fontSize: "1.1rem" }}>
                      {grid.get(student) ? "" : "—"}
                    </td>
                    {subjects.map((subj) => {
                      const cell = row?.get(subj);
                      return (
    <ServiceGate slug="results">
                        <td key={subj} style={{ padding: "1.2rem 1rem", textAlign: "center" }}>
                          {cell?.score != null ? (
                            <span style={{ fontWeight: 700 }}>{cell.score}</span>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>—</span>
                          )}
                          {cell?.grade && (
                            <span style={{ marginLeft: 4, fontSize: "1.1rem", color: gradeColor(cell.grade), fontWeight: 700 }}>
                              ({cell.grade})
                            </span>
                          )}
                        </td>
                          </ServiceGate>
  );
                    })}
                    <td style={{ padding: "1.2rem", textAlign: "center", fontWeight: 800, color: "#6A5ACD" }}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && students.length === 0 && classId && (
        <div className="table-empty">No results found. Generate results first in the Results page.</div>
      )}
    </div>
  );
}
