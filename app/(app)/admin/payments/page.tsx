"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Payment {
  id: string; school_name?: string; amount: number; status: string;
  payment_method?: string; reference?: string; created_at: string;
  service_name?: string;
}

const PAGE_SIZE = 20;

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    authenticatedFetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => setPayments(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchSearch = !q || (p.school_name ?? "").toLowerCase().includes(q) || (p.reference ?? "").toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  }, [payments, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Billing history uses 'paid' status for completed payments
  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Platform Payments</h1>
          <p>All subscription and service payments.</p>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
        <div>
          <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Revenue</div>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "#6A5ACD" }}>₦{totalRevenue.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Transactions</div>
          <div style={{ fontSize: "3rem", fontWeight: 800 }}>{payments.length}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search school or reference…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="paid">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading payments…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">No payments found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.school_name ?? "—"}</td>
                  <td>{p.service_name ?? "—"}</td>
                    <td style={{ fontWeight: 700, color: "#6A5ACD" }}>₦{Number(p.amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "failed" ? "badge-red" : "badge-yellow"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.payment_method ?? "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "1.2rem" }}>{p.reference ?? "—"}</td>
                  <td>{new Date(p.created_at).toLocaleDateString("en-NG")}</td>
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
