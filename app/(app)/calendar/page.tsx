"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface CalendarEvent {
  id: string; title: string; description?: string; type?: string;
  start_date: string; end_date?: string; term?: string; is_public?: number;
}

const EVENT_TYPES = ["holiday", "exam", "meeting", "sports", "cultural", "academic", "other"];
const TYPE_COLORS: Record<string, string> = {
  holiday: "#f59e0b", exam: "#ef4444", meeting: "#6A5ACD",
  sports: "#22c55e", cultural: "#3b82f6", academic: "#8b5cf6", other: "#94a3b8",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", type: "academic",
    startDate: "", endDate: "", term: "", isPublic: true,
  });

  const load = () => {
    setLoading(true);
    authenticatedFetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load calendar"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() =>
    typeFilter ? events.filter((e) => e.type === typeFilter) : events,
    [events, typeFilter]
  );

  // Group by month
  const byMonth = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    filtered.forEach((e) => {
      const key = new Date(e.start_date).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return groups;
  }, [filtered]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title || !form.startDate) return toast.error("Title and start date are required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate || null,
          term: form.term || null,
          isPublic: form.isPublic ? 1 : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Event added");
      setForm({ title: "", description: "", type: "academic", startDate: "", endDate: "", term: "", isPublic: true });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Event deleted");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Academic Calendar</h1>
          <p>School events, holidays, and key dates for the session.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "📅 Add Event"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">New Calendar Event</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Exams" required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Term</label>
                <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                  <option value="">Any</option>
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional details…" style={{ resize: "vertical" }} />
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input type="checkbox" id="pub" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} style={{ width: "auto", accentColor: "#6A5ACD" }} />
                <label htmlFor="pub" style={{ margin: 0 }}>Visible to parents and students</label>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding…" : "Add Event"}
            </button>
          </form>
        </div>
      )}

      {/* Type filter pills */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
        <button onClick={() => setTypeFilter("")}
          style={{ padding: "0.6rem 1.4rem", borderRadius: 20, border: "1px solid #e2e8f0", fontSize: "1.3rem", cursor: "pointer", background: !typeFilter ? "#6A5ACD" : "white", color: !typeFilter ? "white" : "#475569", fontWeight: 600 }}>
          All
        </button>
        {EVENT_TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t === typeFilter ? "" : t)}
            style={{ padding: "0.6rem 1.4rem", borderRadius: 20, border: "1px solid", fontSize: "1.3rem", cursor: "pointer", fontWeight: 600, borderColor: TYPE_COLORS[t] ?? "#e2e8f0", background: typeFilter === t ? (TYPE_COLORS[t] ?? "#6A5ACD") : "white", color: typeFilter === t ? "white" : (TYPE_COLORS[t] ?? "#475569") }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-empty">Loading calendar…</div>
      ) : byMonth.size === 0 ? (
        <div className="table-empty">No events scheduled.</div>
      ) : (
        Array.from(byMonth.entries()).map(([month, evts]) => (
          <div key={month} style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#334155", marginBottom: "1.5rem", paddingBottom: "0.8rem", borderBottom: "2px solid #f1f5f9" }}>{month}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {evts.map((e) => (
                <div key={e.id} style={{ background: "white", border: "1px solid #f1f5f9", borderLeft: `4px solid ${TYPE_COLORS[e.type ?? "other"] ?? "#94a3b8"}`, borderRadius: 12, padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.3rem" }}>{e.title}</div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "1.3rem", color: "#64748b" }}>
                      <span>{new Date(e.start_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}{e.end_date && e.end_date !== e.start_date ? ` – ${new Date(e.end_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : ""}</span>
                      {e.term && <span>{e.term}</span>}
                      {e.description && <span>{e.description}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span className={`badge ${e.is_public ? "badge-green" : "badge-gray"}`} style={{ fontSize: "1.1rem" }}>
                      {e.is_public ? "Public" : "Private"}
                    </span>
                    <button onClick={() => handleDelete(e.id)}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.6rem" }}
                      title="Delete">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
