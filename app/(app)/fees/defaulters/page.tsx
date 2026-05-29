"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../../shared.css";

interface Defaulter {
  student_id: string;
  student_name?: string;
  admission_no?: string;
  class_name?: string;
  class_section?: string;
  fee_title?: string;
  total_amount?: number;
  amount_paid?: number;
  outstanding?: number;
}

export default function FeeDefaultersPage() {

  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/fees/defaulters", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDefaulters(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load defaulters"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return defaulters;
    return defaulters.filter(
      (d) =>
        (d.student_name ?? "").toLowerCase().includes(q) ||
        (d.admission_no ?? "").toLowerCase().includes(q)
    );
  }, [defaulters, search]);

  const totalOutstanding = filtered.reduce((s, d) => s + (Number(d.outstanding) || 0), 0);

  return (
    <ServiceGate slug="fees">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Fee Defaulters</h1>
          <p>Students with outstanding fee balances requiring follow-up.</p>
        </div>
      </div>

      <div style={{ background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 16, padding: "2rem 2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
        <div>
          <div style={{ fontSize: "1.2rem", color: "#9f1239", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Outstanding</div>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, color: "#e11d48" }}>₦{totalOutstanding.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: "1.2rem", color: "#9f1239", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Defaulters</div>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, color: "#e11d48" }}>{filtered.length}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or admission number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading defaulters…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty" style={{ color: "#22c55e" }}>
            🎉 No fee defaulters found.
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Fee Schedule</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.student_id}>
                  <td style={{ fontWeight: 700 }}>{d.student_name ?? "—"}</td>
                  <td><span className="mono">{d.admission_no ?? "—"}</span></td>
                  <td>
                    {d.class_name
                      ? d.class_section
                        ? `${d.class_name} ${d.class_section}`
                        : d.class_name
                      : "—"}
                  </td>
                  <td>{d.fee_title ?? "—"}</td>
                  <td>₦{(Number(d.total_amount) || 0).toLocaleString()}</td>
                  <td style={{ color: "#22c55e", fontWeight: 700 }}>₦{(Number(d.amount_paid) || 0).toLocaleString()}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: "#e11d48", fontSize: "1.4rem" }}>
                      ₦{(Number(d.outstanding) || 0).toLocaleString()}
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
