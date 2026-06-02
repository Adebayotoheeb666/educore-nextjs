"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  subject?: string;
  quantity?: number;
  available_quantity?: number;
  created_at?: string;
}

const PAGE_SIZE = 12;

export default function LibraryPage() {

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", subject: "", quantity: "1" });

  const load = () => {
    setLoading(true);
    authenticatedFetch("/api/library/books")
      .then((r) => r.json())
      .then((d) => setBooks(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load books"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author ?? "").toLowerCase().includes(q) ||
        (b.subject ?? "").toLowerCase().includes(q) ||
        (b.isbn ?? "").includes(q)
    );
  }, [books, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Book registered");
      setForm({ title: "", author: "", isbn: "", subject: "", quantity: "1" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add book");
    } finally {
      setSubmitting(false);
    }
  };

  const totalBooks = books.length;
  const availableBooks = books.reduce((s, b) => s + (Number(b.available_quantity) || Number(b.quantity) || 0), 0);
  const borrowedBooks = books.reduce((s, b) => s + Math.max(0, (Number(b.quantity) || 0) - (Number(b.available_quantity) || Number(b.quantity) || 0)), 0);

  return (
    <ServiceGate slug="library">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Library Management</h1>
          <p>Manage book inventory, borrowing, and returns.</p>
        </div>
        <div className="header-actions">
          <Link href="/library/overdue" className="btn-outline">⚠️ Overdue</Link>
          <Link href="/library/borrow-return" className="btn-outline">🔄 Borrow / Return</Link>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "➕ Add Book"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Total Titles", value: totalBooks, icon: "📚", color: "#3730a3" },
          { label: "Available", value: availableBooks, icon: "✅", color: "#16a34a" },
          { label: "Borrowed", value: borrowedBooks, icon: "📤", color: "#d97706" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem", display: "flex", alignItems: "center", gap: "2rem" }}>
            <span style={{ fontSize: "3rem" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Book Form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">Register New Book</div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Book title" required />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN" />
              </div>
              <div className="form-group">
                <label>Subject / Category</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Registering…" : "Register Book"}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, author, subject, or ISBN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading books…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">
            {books.length === 0 ? "No books in the library yet." : "No books match your search."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Subject</th>
                <th>ISBN</th>
                <th>Quantity</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700 }}>{b.title}</td>
                  <td>{b.author ?? "—"}</td>
                  <td>{b.subject ? <span className="badge badge-blue">{b.subject}</span> : "—"}</td>
                  <td><span className="mono">{b.isbn ?? "—"}</span></td>
                  <td>{b.quantity ?? "—"}</td>
                  <td>
                    <span className={`badge ${(Number(b.available_quantity) || 0) > 0 ? "badge-green" : "badge-red"}`}>
                      {b.available_quantity ?? b.quantity ?? 0}
                    </span>
                  </td>
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
      </ServiceGate>
  );
}
