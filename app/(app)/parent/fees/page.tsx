"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Script from "next/script";
import "../../shared.css";

interface Child { id: string; name: string; email?: string; }
interface FeeSchedule {
  id: string; name?: string; title?: string; amount?: number;
  total_amount?: number; due_date?: string; is_paid?: boolean; paid_amount?: number;
}

export default function ParentFeesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [fees, setFees] = useState<FeeSchedule[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parents/children", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list: Child[] = Array.isArray(d.data) ? d.data : [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    fetch(`/api/fees/student?studentId=${selectedChild}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFees(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load fees"));
  }, [selectedChild]);

  const child = children.find((c) => c.id === selectedChild);

  const handlePay = async (fee: FeeSchedule) => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) return toast.error("Payment not configured");
    if (!child?.email) return toast.error("No email linked to student account");

    setPaying(fee.id);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId: selectedChild, feeId: fee.id }),
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
            window.open(authorizationUrl, "_blank");
            toast.info("Complete payment in the new tab");
            return;
          } catch (err) {
            toast.error("Unable to open payment link in this environment");
            return;
          }
        }

        const handler = window.PaystackPop.setup({
        key: publicKey,
        email: child.email,
        amount: amount * 100,
        ref: reference,
        onClose: () => toast.info("Payment window closed"),
        callback: async (response) => {
          const verify = await fetch(
            `/api/payments/verify?reference=${response.reference}`,
            { credentials: "include" }
          ).then((r) => r.json());
          if (verify.data?.verified) {
            toast.success(`Payment of ₦${amount.toLocaleString()} confirmed!`);
            setFees((prev) => prev.map((f) => f.id === fee.id ? { ...f, is_paid: true, paid_amount: amount } : f));
          } else {
            toast.error("Payment could not be verified");
          }
        },
      });
        try {
          handler.openIframe();
        } catch (err: unknown) {
          toast.error("Unable to open Paystack payment iframe");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Payment failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(null);
    }
  };

  const totalDue = fees.reduce((s, f) => s + ((f.total_amount ?? f.amount ?? 0) - (f.paid_amount ?? 0)), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paid_amount ?? 0), 0);

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" />

      <div>
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>School Fees</h1>
            <p>View and pay your child's outstanding fees.</p>
          </div>
          {children.length > 1 && (
            <div className="header-actions">
              <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
                style={{ padding: "0.8rem 1.5rem", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}>
                {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Due</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: totalDue > 0 ? "#ef4444" : "#22c55e" }}>₦{totalDue.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Paid</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "#22c55e" }}>₦{totalPaid.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {fees.length === 0 ? (
            <div className="table-empty">No fee schedules found for this student.</div>
          ) : (
            fees.map((fee) => {
              const amount = fee.total_amount ?? fee.amount ?? 0;
              const paid = fee.paid_amount ?? 0;
              const outstanding = amount - paid;
              const isPaid = fee.is_paid || outstanding <= 0;
              return (
                <div key={fee.id} style={{ background: "white", border: `1px solid ${isPaid ? "#dcfce7" : "#fef9c3"}`, borderRadius: 16, padding: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>{fee.title ?? fee.name}</h3>
                    <div style={{ display: "flex", gap: "2rem", fontSize: "1.3rem", color: "#64748b" }}>
                      <span>Total: <strong>₦{amount.toLocaleString()}</strong></span>
                      <span>Paid: <strong style={{ color: "#22c55e" }}>₦{paid.toLocaleString()}</strong></span>
                      {!isPaid && <span>Outstanding: <strong style={{ color: "#ef4444" }}>₦{outstanding.toLocaleString()}</strong></span>}
                      {fee.due_date && <span>Due: {new Date(fee.due_date).toLocaleDateString("en-NG")}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    {isPaid ? (
                      <span className="badge badge-green" style={{ fontSize: "1.3rem", padding: "0.6rem 1.4rem" }}>Paid ✓</span>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => handlePay(fee)}
                        disabled={paying === fee.id}
                      >
                        {paying === fee.id ? "Processing…" : `Pay ₦${outstanding.toLocaleString()}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
