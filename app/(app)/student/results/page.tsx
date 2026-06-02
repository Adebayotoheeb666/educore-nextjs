"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Result {
  subject_name: string; score?: number; grade?: string;
  term: string; class_name?: string; total_marks?: number;
}

export default function StudentResultsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [results, setResults] = useState<Result[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const params = new URLSearchParams();
    if (term) params.set("term", term);
    setLoading(true);
    authenticatedFetch(`/api/results/parent/${user.id}?${params}`)
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, [user?.id, term]);

  const withScores = results.filter((r) => r.score != null);
  const avg = withScores.length > 0
    ? (withScores.reduce((s, r) => s + (Number(r.score) || 0), 0) / withScores.length).toFixed(1)
    : "—";
  const highest = withScores.length > 0 ? Math.max(...withScores.map((r) => Number(r.score) || 0)) : 0;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Results</h1>
          <p>Academic performance report.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">All terms</option>
          <option value="1st Term">1st Term</option>
          <option value="2nd Term">2nd Term</option>
          <option value="3rd Term">3rd Term</option>
        </select>
      </div>

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
          {[
            { label: "Average Score", value: avg, color: "#6A5ACD" },
            { label: "Highest Score", value: String(highest), color: "#22c55e" },
            { label: "Subjects", value: String(results.length), color: "#3b82f6" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.8rem" }}>{label}</div>
              <div style={{ fontSize: "3rem", fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading results…</div>
        ) : results.length === 0 ? (
          <div className="table-empty">No results available.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Term</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pct = r.total_marks && r.score ? Math.round((Number(r.score) / r.total_marks) * 100) : null;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{r.subject_name}</td>
                    <td style={{ fontWeight: 700, color: "#6A5ACD", fontSize: "1.6rem" }}>{r.score ?? "—"}</td>
                    <td style={{ color: "#94a3b8" }}>{r.total_marks ?? 100}{pct != null && <span style={{ marginLeft: 6, fontSize: "1.2rem" }}>({pct}%)</span>}</td>
                    <td>
                      <span className={`badge ${(r.grade ?? "").startsWith("A") ? "badge-green" : (r.grade ?? "").startsWith("B") ? "badge-blue" : (r.grade ?? "").startsWith("C") ? "badge-yellow" : "badge-red"}`}>
                        {r.grade ?? "—"}
                      </span>
                    </td>
                    <td>{r.term}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
