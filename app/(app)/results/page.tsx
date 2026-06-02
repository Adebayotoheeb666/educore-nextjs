"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface Result {
  id: string;
  student_name?: string;
  class_name?: string;
  class_section?: string;
  term?: string;
  session?: string;
  overall_percentage?: number;
  position?: number;
  grade?: string;
  status?: string;
}

interface ClassItem { id: string; name: string; section?: string; }

const TERMS = ["First Term", "Second Term", "Third Term"];

export default function ResultsPage() {

  const [results, setResults] = useState<Result[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [term, setTerm] = useState("First Term");
  const [session, setSession] = useState("2024/2025");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/results").then((r) => r.json()),
      authenticatedFetch("/api/classes").then((r) => r.json()),
    ])
      .then(([rd, cd]) => {
        setResults(Array.isArray(rd.data) ? rd.data : rd.data?.results ?? []);
        const list: ClassItem[] = Array.isArray(cd.data) ? cd.data : [];
        setClasses(list);
        if (list[0]) setSelectedClass(list[0].id);
      })
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return results.filter((r) => {
      const matchClass = !selectedClass || r.class_name === classes.find((c) => c.id === selectedClass)?.name;
      const matchTerm = !term || (r.term ?? "").toLowerCase().includes(term.toLowerCase());
      const matchSearch = !q || (r.student_name ?? "").toLowerCase().includes(q);
      return matchClass && matchTerm && matchSearch;
    });
  }, [results, selectedClass, term, search, classes]);

  const summary = useMemo(() => {
    if (!filtered.length) return { avg: null, above50: 0, below40: 0 };
    const scores = filtered.map((r) => Number(r.overall_percentage) || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      avg: avg.toFixed(1),
      above50: scores.filter((s) => s >= 50).length,
      below40: scores.filter((s) => s < 40).length,
    };
  }, [filtered]);

  const handleCompute = async () => {
    if (!selectedClass) return toast.error("Select a class first");
    setComputing(true);
    try {
      const res = await authenticatedFetch("/api/results/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, term, session }),
      });
      if (!res.ok) throw new Error();
      toast.success("Results computed — refresh to see updates");
    } catch {
      toast.error("Failed to compute results");
    } finally {
      setComputing(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const res = await authenticatedFetch("/api/results/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, term, session }),
      });
      if (!res.ok) throw new Error();
      toast.success("Results released to parents and students");
    } catch {
      toast.error("Failed to release results");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <ServiceGate slug="results">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Results</h1>
          <p>Compute, review, and release academic results by class and term.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleCompute} disabled={computing}>
            {computing ? "Computing…" : "⚙️ Compute Results"}
          </button>
          <button className="btn-primary" onClick={handleRelease} disabled={releasing}>
            {releasing ? "Releasing…" : "📤 Release Results"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="filter-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.section ? ` ${c.section}` : ""}
            </option>
          ))}
        </select>
        <select className="filter-select" value={term} onChange={(e) => setTerm(e.target.value)}>
          {TERMS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input
          className="filter-select"
          type="text"
          placeholder="Search student…"
          style={{ flex: 1 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Average Score", value: summary.avg ? `${summary.avg}%` : "—", icon: "📊", color: "#6A5ACD" },
          { label: "Above 50%", value: summary.above50, icon: "✅", color: "#22c55e" },
          { label: "Below 40%", value: summary.below40, icon: "⚠️", color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "3rem" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: "2.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading results…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            No results found for selected filters.
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Term</th>
                <th>Overall %</th>
                <th>Grade</th>
                <th>Position</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.student_name ?? "—"}</td>
                  <td>
                    {r.class_name
                      ? r.class_section
                        ? `${r.class_name} ${r.class_section}`
                        : r.class_name
                      : "—"}
                  </td>
                  <td>{r.term ?? "—"}</td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      color: (r.overall_percentage ?? 0) < 40 ? "#ef4444" :
                             (r.overall_percentage ?? 0) >= 70 ? "#22c55e" : "#f59e0b",
                    }}>
                      {r.overall_percentage != null ? `${r.overall_percentage}%` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      r.grade === "A" ? "badge-green" :
                      r.grade === "F" ? "badge-red" : "badge-yellow"
                    }`}>
                      {r.grade ?? "—"}
                    </span>
                  </td>
                  <td>{r.position ? `#${r.position}` : "—"}</td>
                  <td>
                    <span className={`badge ${r.status === "released" ? "badge-green" : "badge-gray"}`}>
                      {r.status ?? "draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
      </ServiceGate>
  );
}
