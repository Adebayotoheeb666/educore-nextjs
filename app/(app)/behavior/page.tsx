"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import "../shared.css";

interface BehaviorLog {
  id: string; student_name: string; type: string; description: string;
  date: string; recorded_by_name?: string; severity?: string;
}
interface Student { id: string; name: string; }

const PAGE_SIZE = 15;
const TYPES = ["positive", "negative", "neutral", "warning", "commendation"];
const SEVERITIES = ["low", "medium", "high"];

export default function BehaviorPage() {
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ studentId: "", type: "positive", description: "", date: "", severity: "low" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/behavior", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/students", { credentials: "include" }).then((r) => r.json()),
    ]).then(([bd, sd]) => {
      setLogs(Array.isArray(bd.data) ? bd.data : []);
      setStudents(Array.isArray(sd.data) ? sd.data : sd.data?.students ?? []);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchSearch = !q || l.student_name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
      const matchType = !typeFilter || l.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.description) return toast.error("Student and description are required");
    setSubmitting(true);
    try {
      const res = await fetch("/api/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: form.studentId,
          type: form.type,
          description: form.description,
          date: form.date || undefined,
          severity: form.severity,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Behavior log recorded");
      setForm({ studentId: "", type: "positive", description: "", date: "", severity: "low" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setSubmitting(false);
    }
  };

  const typeBadge = (t: string) => {
    if (t === "positive" || t === "commendation") return "badge-green";
    if (t === "negative" || t === "warning") return "badge-red";
    return "badge-blue";
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Behavior Log</h1>
          <p>Track and manage student behavior incidents and commendations.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "📋 Log Behavior"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">Record Behavior</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Student *</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Severity</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the behavior…" required style={{ resize: "vertical" }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Save Log"}
            </button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search by student or description…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div className="premium-table-card">
        {loading ? <div className="table-empty">Loading…</div> : paginated.length === 0 ? <div className="table-empty">No behavior logs found.</div> : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Recorded By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700 }}>{l.student_name}</td>
                  <td><span className={`badge ${typeBadge(l.type)}`}>{l.type}</span></td>
                  <td><span className={`badge ${l.severity === "high" ? "badge-red" : l.severity === "medium" ? "badge-yellow" : "badge-gray"}`}>{l.severity ?? "low"}</span></td>
                  <td style={{ maxWidth: 280, fontSize: "1.3rem" }}>{l.description}</td>
                  <td style={{ color: "#64748b" }}>{l.recorded_by_name ?? "—"}</td>
                  <td>{l.date ? new Date(l.date).toLocaleDateString("en-NG") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="table-pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="pag-buttons">
              <button className="pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pag-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
