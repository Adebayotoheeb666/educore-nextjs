"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface OverdueBorrow {
  id: string; book_id?: string; book_title?: string;
  borrower_name?: string; due_date: string; borrowed_at: string;
}

export default function OverdueLibraryPage() {
  const [borrows, setBorrows] = useState<OverdueBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    authenticatedFetch("/api/library/borrows?status=borrowed")
      .then((r) => r.json())
      .then((d) => {
        const all: OverdueBorrow[] = Array.isArray(d.data) ? d.data : [];
        const now = new Date();
        setBorrows(all.filter((b) => b.due_date && new Date(b.due_date) < now));
      })
      .catch(() => toast.error("Failed to load overdue books"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReturn = async (b: OverdueBorrow) => {
    setReturning(b.id);
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
      toast.error(err instanceof Error ? err.message : "Failed to process return");
    } finally {
      setReturning(null);
    }
  };

  const daysOverdue = (dueDate: string) =>
    Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Overdue Books</h1>
          <p>Books that have not been returned by their due date.</p>
        </div>
      </div>

      {!loading && borrows.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "2rem 2.5rem", marginBottom: "3rem", fontSize: "1.5rem", color: "#991b1b", fontWeight: 600 }}>
          ⚠️ {borrows.length} book{borrows.length !== 1 ? "s are" : " is"} overdue.
        </div>
      )}

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading…</div>
        ) : borrows.length === 0 ? (
          <div className="table-empty" style={{ color: "#22c55e", fontWeight: 600 }}>
            No overdue books — all clear!
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((b) => {
                const days = daysOverdue(b.due_date);
                return (
                  <tr key={b.id} style={{ background: days > 14 ? "#fff5f5" : "white" }}>
                    <td style={{ fontWeight: 700 }}>{b.book_title ?? "—"}</td>
                    <td>{b.borrower_name ?? "—"}</td>
                    <td>{new Date(b.borrowed_at).toLocaleDateString("en-NG")}</td>
                    <td style={{ color: "#ef4444", fontWeight: 700 }}>
                      {new Date(b.due_date).toLocaleDateString("en-NG")}
                    </td>
                    <td>
                      <span style={{ background: days > 14 ? "#fee2e2" : "#fef9c3", color: days > 14 ? "#991b1b" : "#854d0e", padding: "0.4rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "1.3rem" }}>
                        {days} day{days !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleReturn(b)}
                        disabled={returning === b.id}
                      >
                        {returning === b.id ? "Processing…" : "Mark Returned"}
                      </button>
                    </td>
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
