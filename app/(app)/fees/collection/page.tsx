"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { openExternal } from "@/lib/utils/openExternal";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../../shared.css";

interface Payment {
  id: string;
  student_name?: string;
  fee_title?: string;
  amount_paid?: number;
  payment_method?: string;
  payment_date?: string;
  reference?: string;
}

interface Student { id: string; name: string; admission_no?: string; email?: string; }
interface FeeSchedule { id: string; title?: string; name?: string; total_amount?: number; amount?: number; }

const PAGE_SIZE = 15;

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe(): void };
    };
  }
}

export default function FeeCollectionPage() {

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"cash" | "online" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    studentId: "", feeId: "", amountPaid: "", paymentMethod: "cash", reference: "",
  });
  const paystackLoaded = useRef(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/fees/payment", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/students", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/fees", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([pd, sd, fd]) => {
        setPayments(Array.isArray(pd.data) ? pd.data : []);
        setStudents(Array.isArray(sd.data) ? sd.data : sd.data?.students ?? []);
        setFees(Array.isArray(fd.data) ? fd.data : []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        (p.student_name ?? "").toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCollected = payments.reduce((s, p) => s + (Number(p.amount_paid) || 0), 0);

  const selectedStudent = students.find((s) => s.id === form.studentId);
  const selectedFee = fees.find((f) => f.id === form.feeId);
  const feeAmount = selectedFee?.total_amount ?? selectedFee?.amount ?? 0;

  const handleCashRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.feeId || !form.amountPaid) {
      return toast.error("Student, fee schedule, and amount are required");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/fees/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: form.studentId,
          feeId: form.feeId,
          amountPaid: Number(form.amountPaid),
          paymentMethod: form.paymentMethod,
          reference: form.reference || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Payment recorded");
      setForm({ studentId: "", feeId: "", amountPaid: "", paymentMethod: "cash", reference: "" });
      setMode(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOnline = async () => {
    if (!form.studentId || !form.feeId) {
      return toast.error("Select a student and fee schedule first");
    }
    if (!selectedStudent?.email) {
      return toast.error("Student has no email address on record");
    }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      return toast.error("Paystack public key not configured");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId: form.studentId, feeId: form.feeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const { authorizationUrl, reference, amount } = json.data;

      try {
        if (typeof window === "undefined") {
          toast.info("Open the payment link in an external browser: " + authorizationUrl);
          return;
        }

        if (!window.PaystackPop) {
          try {
            await openExternal(authorizationUrl);
            toast.info("Complete payment in the new tab, then refresh the page.");
            return;
          } catch (err) {
            toast.error("Unable to open payment link in this environment");
            return;
          }
        }

        const handler = window.PaystackPop.setup({
        key: publicKey,
        email: selectedStudent.email,
        amount: amount * 100, // kobo
        ref: reference,
        onClose: () => toast.info("Payment window closed"),
        callback: async (response) => {
          const tid = toast.loading("Verifying payment…");
          try {
            const verify = await fetch(
              `/api/payments/verify?reference=${response.reference}`,
              { credentials: "include" }
            ).then((r) => r.json());
            toast.dismiss(tid);
            if (verify.data?.verified) {
              toast.success(`Payment of ₦${amount.toLocaleString()} confirmed!`);
              setMode(null);
              setForm({ studentId: "", feeId: "", amountPaid: "", paymentMethod: "cash", reference: "" });
              load();
            } else {
              toast.error("Payment could not be verified — contact admin if deducted.");
            }
          } catch {
            toast.dismiss(tid);
            toast.error("Verification request failed");
          }
        },
      });
        try {
          handler.openIframe();
        } catch (err: unknown) {
          toast.error("Unable to open Paystack payment iframe");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Payment initialization failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment initialization failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => { paystackLoaded.current = true; }}
      />

      <div>
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>Fee Collection</h1>
            <p>Record payments and view collection history.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setMode(mode === "cash" ? null : "cash")}>
              {mode === "cash" ? "Cancel" : "💵 Record Cash"}
            </button>
            <button className="btn-primary" onClick={() => setMode(mode === "online" ? null : "online")}>
              {mode === "online" ? "Cancel" : "💳 Pay via Paystack"}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Collected</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "#6A5ACD" }}>₦{totalCollected.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Transactions</div>
            <div style={{ fontSize: "3rem", fontWeight: 800 }}>{payments.length}</div>
          </div>
        </div>

        {/* Cash Payment Form */}
        {mode === "cash" && (
          <div className="form-card" style={{ marginBottom: "3rem" }}>
            <div className="form-section-title">Record Cash / Manual Payment</div>
            <form onSubmit={handleCashRecord}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Student *</label>
                  <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.admission_no ? ` (${s.admission_no})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fee Schedule *</label>
                  <select value={form.feeId} onChange={(e) => setForm({ ...form, feeId: e.target.value })} required>
                    <option value="">Select fee</option>
                    {fees.map((f) => {
                      const amt = f.total_amount ?? f.amount ?? 0;
                      return (
                        <option key={f.id} value={f.id}>
                          {f.title ?? f.name}{amt ? ` — ₦${amt.toLocaleString()}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount Paid (₦) *</label>
                  <input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} placeholder="0.00" min="1" required />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reference / Receipt No.</label>
                  <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Recording…" : "Record Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Paystack Online Payment */}
        {mode === "online" && (
          <div className="form-card" style={{ marginBottom: "3rem" }}>
            <div className="form-section-title">Pay Online via Paystack</div>
            <p style={{ fontSize: "1.4rem", color: "#64748b", marginBottom: "2rem" }}>
              Select a student and fee schedule, then click "Open Paystack" to complete payment securely.
            </p>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Student *</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.admission_no ? ` (${s.admission_no})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fee Schedule *</label>
                <select value={form.feeId} onChange={(e) => setForm({ ...form, feeId: e.target.value })}>
                  <option value="">Select fee</option>
                  {fees.map((f) => {
                    const amt = f.total_amount ?? f.amount ?? 0;
                    return (
    <ServiceGate slug="fees">
                      <option key={f.id} value={f.id}>
                        {f.title ?? f.name}{amt ? ` — ₦${amt.toLocaleString()}` : ""}
                      </option>
                        </ServiceGate>
  );
                  })}
                </select>
              </div>
            </div>
            {selectedStudent && selectedFee && (
              <div style={{ background: "#f8f7ff", border: "1px solid #c4b5fd", borderRadius: 12, padding: "1.5rem 2rem", marginBottom: "2rem", fontSize: "1.4rem" }}>
                <strong>{selectedStudent.name}</strong> will be charged{" "}
                <strong style={{ color: "#6A5ACD" }}>₦{feeAmount.toLocaleString()}</strong> for{" "}
                <strong>{selectedFee.title ?? selectedFee.name}</strong>.
              </div>
            )}
            <button
              className="btn-primary"
              onClick={handlePayOnline}
              disabled={submitting || !form.studentId || !form.feeId}
            >
              {submitting ? "Initializing…" : "Open Paystack"}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by student or reference…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="premium-table-card">
          {loading ? (
            <div className="table-empty">Loading payments…</div>
          ) : paginated.length === 0 ? (
            <div className="table-empty">No payments recorded yet.</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Fee Schedule</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.student_name ?? "—"}</td>
                    <td>{p.fee_title ?? "—"}</td>
                    <td style={{ fontWeight: 700, color: "#6A5ACD" }}>
                      ₦{(Number(p.amount_paid) || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${p.payment_method === "online" ? "badge-green" : "badge-blue"}`}>
                        {p.payment_method ?? "cash"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "1.2rem" }}>{p.reference ?? "—"}</td>
                    <td>
                      {p.payment_date
                        ? new Date(p.payment_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length > PAGE_SIZE && (
            <div className="table-pagination">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
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
    </>
  );
}
