"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../../shared.css";

interface FeeItem { name: string; amount: number | string; }
interface FeeSchedule {
  id: string;
  title?: string;
  name?: string;
  term?: string;
  session?: string;
  class_name?: string;
  due_date?: string;
  total_amount?: number;
  amount?: number;
  items?: FeeItem[];
}
interface ClassItem { id: string; name: string; section?: string; }

const TERMS = ["First Term", "Second Term", "Third Term"];
const EMPTY_FORM = { title: "", term: "First Term", session: "2024/2025", classId: "", dueDate: "" };

export default function FeeSchedulesPage() {

  const [schedules, setSchedules] = useState<FeeSchedule[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState<FeeItem[]>([{ name: "Tuition", amount: "" }]);

  const load = () => {
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/fees").then((r) => r.json()),
      authenticatedFetch("/api/classes").then((r) => r.json()),
    ])
      .then(([fd, cd]) => {
        setSchedules(Array.isArray(fd.data) ? fd.data : []);
        setClasses(Array.isArray(cd.data) ? cd.data : []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setItems([{ name: "Tuition", amount: "" }]);
    setShowForm(false);
  };

  const startEdit = (s: FeeSchedule) => {
    setEditingId(s.id);
    setForm({
      title: s.title ?? s.name ?? "",
      term: s.term ?? "First Term",
      session: s.session ?? "2024/2025",
      classId: "",
      dueDate: s.due_date ? s.due_date.slice(0, 10) : "",
    });
    setItems(s.items?.length ? s.items.map((i) => ({ name: i.name, amount: String(i.amount) })) : [{ name: "Tuition", amount: "" }]);
    setShowForm(true);
    try {
      if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (_) {
      // ignore in restricted environments (SSR / WebView without scroll API)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return toast.error("Title and due date are required");
    const feeItems = items.filter((i) => i.name && Number(i.amount) > 0);
    if (!feeItems.length) return toast.error("Add at least one fee item");

    setSubmitting(true);
    try {
      const url = editingId ? `/api/fees/${editingId}` : "/api/fees";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          items: feeItems.map((i) => ({ name: i.name, amount: Number(i.amount) })),
          totalAmount,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(editingId ? "Fee schedule updated" : "Fee schedule created");
      reset();
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save fee schedule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ServiceGate slug="fees">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Fee Schedules</h1>
          <p>Create and manage fee structures for each class and term.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => { reset(); setShowForm((v) => !v); }}>
            {showForm ? "Cancel" : "+ Create Schedule"}
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">{editingId ? "Edit Fee Schedule" : "New Fee Schedule"}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. First Term 2024/2025 Fees" required />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Term</label>
                <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                  {TERMS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Session</label>
                <input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} placeholder="2024/2025" />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
            </div>

            {/* Fee items */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1.3rem", color: "#334155" }}>FEE ITEMS</div>
              {items.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: "1rem", marginBottom: "1rem" }}>
                  <input
                    className="form-group input"
                    style={{ padding: "1.1rem 1.5rem", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1.4rem" }}
                    placeholder="Fee name"
                    value={item.name}
                    onChange={(e) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                  />
                  <input
                    type="number"
                    style={{ padding: "1.1rem 1.5rem", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1.4rem" }}
                    placeholder="Amount (₦)"
                    value={item.amount}
                    onChange={(e) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, amount: e.target.value } : it))}
                  />
                  {items.length > 1 && (
                    <button type="button" style={{ background: "#fee2e2", color: "#e11d48", border: "none", borderRadius: 8, padding: "0 1.2rem", cursor: "pointer", fontWeight: 700 }}
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-outline" style={{ marginTop: "0.5rem" }}
                onClick={() => setItems((prev) => [...prev, { name: "", amount: "" }])}>
                + Add Item
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <strong style={{ fontSize: "1.6rem" }}>Total: ₦{totalAmount.toLocaleString()}</strong>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Update Schedule" : "Create Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading fee schedules…</div>
        ) : schedules.length === 0 ? (
          <div className="table-empty">No fee schedules created yet.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Term</th>
                <th>Total Amount</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.title ?? s.name ?? "Untitled"}</td>
                  <td>{s.class_name ?? "All"}</td>
                  <td>{s.term ?? "—"}</td>
                  <td style={{ fontWeight: 700, color: "#6A5ACD" }}>
                    ₦{((s.total_amount ?? s.amount) ?? 0).toLocaleString()}
                  </td>
                  <td>
                    {s.due_date
                      ? new Date(s.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="link-action" style={{ border: "none", background: "none", cursor: "pointer" }} onClick={() => startEdit(s)}>Edit</button>
                    </div>
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
