"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Borrow {
  id: string; book_id?: string; book_title?: string; borrower_name?: string; borrower_role?: string;
  borrowed_at: string; due_date?: string; returned_at?: string; status?: string;
}
interface Book { id: string; title: string; author?: string; available_quantity?: number; }
interface Student { id: string; name: string; admission_no?: string; }

const PAGE_SIZE = 15;

export default function BorrowReturnPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "returned">("active");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ bookId: "", borrowerId: "", dueDate: "", notes: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/library/borrows").then((r) => r.json()),
      authenticatedFetch("/api/library/books").then((r) => r.json()),
      authenticatedFetch("/api/students").then((r) => r.json()),
    ]).then(([bd, bkd, sd]) => {
      setBorrows(Array.isArray(bd.data) ? bd.data : []);
      setBooks(Array.isArray(bkd.data) ? bkd.data : []);
      setStudents(Array.isArray(sd.data) ? sd.data : sd.data?.students ?? []);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = borrows;
    if (filter === "active") list = list.filter((b) => !b.returned_at);
    else if (filter === "returned") list = list.filter((b) => !!b.returned_at);
    const q = search.toLowerCase();
    if (q) list = list.filter((b) =>
      (b.book_title ?? "").toLowerCase().includes(q) || (b.borrower_name ?? "").toLowerCase().includes(q)
    );
    return list;
  }, [borrows, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookId || !form.borrowerId) return toast.error("Book and borrower are required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/library/books/${form.bookId}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: form.borrowerId, dueDate: form.dueDate || null }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Book borrowed successfully");
      setForm({ bookId: "", borrowerId: "", dueDate: "", notes: "" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record borrow");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (b: Borrow) => {
    try {
      const res = await authenticatedFetch(`/api/library/books/${b.book_id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowId: b.id }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Book returned");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record return");
    }
  };

  const isOverdue = (b: Borrow) => !b.returned_at && b.due_date && new Date(b.due_date) < new Date();

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Borrow & Return</h1>
          <p>Record book loans and process returns.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "📖 Borrow Book"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">Record Book Borrow</div>
          <form onSubmit={handleBorrow}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Book *</label>
                <select value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })} required>
                  <option value="">Select book</option>
                  {books.filter((b) => (b.available_quantity ?? 0) > 0).map((b) => (
                    <option key={b.id} value={b.id}>{b.title}{b.author ? ` — ${b.author}` : ""} ({b.available_quantity} avail.)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Borrower (Student) *</label>
                <select value={form.borrowerId} onChange={(e) => setForm({ ...form, borrowerId: e.target.value })} required>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.admission_no ? ` (${s.admission_no})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Recording…" : "Record Borrow"}
            </button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search book or borrower…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {(["all", "active", "returned"] as const).map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ padding: "0.8rem 1.6rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "1.3rem", fontWeight: 600, cursor: "pointer", background: filter === f ? "#6A5ACD" : "white", color: filter === f ? "white" : "#475569" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="premium-table-card">
        {loading ? <div className="table-empty">Loading…</div> : paginated.length === 0 ? <div className="table-empty">No records found.</div> : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => {
                const overdue = isOverdue(b);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{b.book_title ?? "—"}</td>
                    <td>{b.borrower_name ?? "—"}</td>
                    <td>{new Date(b.borrowed_at).toLocaleDateString("en-NG")}</td>
                    <td style={{ color: overdue ? "#ef4444" : "inherit", fontWeight: overdue ? 700 : 400 }}>
                      {b.due_date ? new Date(b.due_date).toLocaleDateString("en-NG") : "—"}
                      {overdue && " ⚠️"}
                    </td>
                    <td>
                      <span className={`badge ${b.returned_at ? "badge-green" : overdue ? "badge-red" : "badge-blue"}`}>
                        {b.returned_at ? "Returned" : overdue ? "Overdue" : "Active"}
                      </span>
                    </td>
                    <td>
                      {!b.returned_at && (
                        <button className="action-btn" onClick={() => handleReturn(b)}>Return</button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
