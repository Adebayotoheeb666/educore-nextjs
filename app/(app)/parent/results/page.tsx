"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Child { id: string; name: string; class_name?: string; }
interface Result {
  subject_name: string; score?: number; grade?: string;
  term: string; class_name?: string; created_at: string;
}

export default function ParentResultsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch("/api/parents/children")
      .then((r) => r.json())
      .then((d) => {
        const list: Child[] = Array.isArray(d.data) ? d.data : [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0].id);
      })
      .catch(() => toast.error("Failed to load children"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    const params = new URLSearchParams();
    if (term) params.set("term", term);
    authenticatedFetch(`/api/results/parent/${selectedChild}?${params}`)
      .then((r) => r.json())
      .then((d) => setResults(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load results"));
  }, [selectedChild, term]);

  const avg = results.length > 0
    ? (results.reduce((s, r) => s + (Number(r.score) || 0), 0) / results.filter((r) => r.score != null).length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Child's Results</h1>
          <p>Academic performance by subject and term.</p>
        </div>
      </div>

      <div className="filter-bar">
        {children.length > 1 && (
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">All terms</option>
          <option value="1st Term">1st Term</option>
          <option value="2nd Term">2nd Term</option>
          <option value="3rd Term">3rd Term</option>
        </select>
      </div>

      {results.length > 0 && (
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Average Score</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "#6A5ACD" }}>{avg}</div>
          </div>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Subjects</div>
            <div style={{ fontSize: "3rem", fontWeight: 800 }}>{results.length}</div>
          </div>
        </div>
      )}

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading results…</div>
        ) : results.length === 0 ? (
          <div className="table-empty">No results available for the selected term.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Term</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{r.subject_name}</td>
                  <td style={{ fontWeight: 700, color: "#6A5ACD", fontSize: "1.6rem" }}>{r.score ?? "—"}</td>
                  <td>
                    <span className={`badge ${(r.grade ?? "").startsWith("A") ? "badge-green" : (r.grade ?? "").startsWith("B") ? "badge-blue" : (r.grade ?? "").startsWith("C") ? "badge-yellow" : "badge-red"}`}>
                      {r.grade ?? "—"}
                    </span>
                  </td>
                  <td>{r.term}</td>
                  <td>{r.class_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
