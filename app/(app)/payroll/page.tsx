"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface Teacher {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface PayrollRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  note?: string;
  status: string;
}

export default function PayrollPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [payments, setPayments] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });

  const totalPayroll = useMemo(() => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [payments]);

  const loadTeachers = async () => {
    try {
      const res = await authenticatedFetch("/api/teachers");
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      setTeachers(list);
      if (!selectedTeacher && list.length > 0) {
        setSelectedTeacher(list[0].id);
      }
    } catch {
      toast.error("Unable to load teachers");
    }
  };

  const loadPayments = async (teacherId?: string) => {
    try {
      const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : "";
      const res = await authenticatedFetch(`/api/payroll${query}`);
      const data = await res.json();
      setPayments(Array.isArray(data.data?.payments) ? data.data.payments : data.data?.payments || []);
    } catch {
      toast.error("Unable to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!selectedTeacher) return;
    setLoading(true);
    loadPayments(selectedTeacher);
  }, [selectedTeacher]);

  const handleCreatePayment = async () => {
    if (!selectedTeacher) return toast.error("Select a teacher first");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    if (!form.paymentMethod.trim()) return toast.error("Payment method is required");

    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          amount,
          paymentMethod: form.paymentMethod,
          reference: form.reference,
          note: form.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record payroll payment");
      toast.success("Payroll payment recorded successfully");
      setForm({ amount: "", paymentMethod: "Bank Transfer", reference: "", note: "" });
      loadPayments(selectedTeacher);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payroll creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ServiceGate slug="payroll">
      <div className="page-content">
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>Payroll</h1>
            <p>Pay teachers from the platform and track payroll history for your school.</p>
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="form-section-title">Salary Disbursement</h2>
              <p style={{ margin: 0, color: "#64748b" }}>Record teacher payouts and log payment details.</p>
            </div>
            <div>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{ padding: "0.9rem 1.3rem", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div>
              <label className="form-label">Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="form-input"
                placeholder="₦ amount"
              />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="form-input"
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginTop: "1rem" }}>
            <div>
              <label className="form-label">Reference</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="form-input"
                placeholder="Optional reference"
              />
            </div>
            <div>
              <label className="form-label">Note</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="form-input"
                placeholder="Optional note"
              />
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button disabled={submitting} onClick={handleCreatePayment} className="btn-primary">
              {submitting ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </div>

        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="form-section-title">Payroll history</h2>
              <p style={{ margin: 0, color: "#64748b" }}>View all teacher pay records for this school.</p>
            </div>
            <div style={{ fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}>Total paid: ₦{totalPayroll.toLocaleString()}</div>
          </div>

          {loading ? (
            <div className="table-empty">Loading payroll history…</div>
          ) : payments.length === 0 ? (
            <div className="table-empty">No payroll records found yet.</div>
          ) : (
            <div className="teacher-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.teacher_name}</td>
                      <td>₦{Number(payment.amount).toLocaleString()}</td>
                      <td>{payment.payment_method}</td>
                      <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td>{payment.reference || "—"}</td>
                      <td>{payment.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ServiceGate>
  );
}
