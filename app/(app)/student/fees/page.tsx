"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Script from "next/script";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { openExternal } from "@/lib/utils/openExternal";
import { IS_MOBILE_WEBVIEW } from "@/lib/utils/runtimeConfig";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface FeeSchedule {
  id: string; name?: string; title?: string; amount?: number;
  total_amount?: number; due_date?: string; is_paid?: boolean; paid_amount?: number;
}

export default function StudentFeesPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [fees, setFees] = useState<FeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    authenticatedFetch(`/api/fees/student?studentId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setFees(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load fees"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handlePay = async (fee: FeeSchedule) => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) return toast.error("Payment not configured");
    if (!user?.email) return toast.error("No email on your account");

    setPaying(fee.id);
    try {
      const res = await authenticatedFetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, feeId: fee.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const { authorizationUrl, reference, amount } = json.data;

      try {
        if (typeof window === "undefined" || IS_MOBILE_WEBVIEW || !window.PaystackPop) {
          try {
            await openExternal(authorizationUrl);
            toast.info("Open the payment link in your browser to complete checkout.");
            return;
          } catch (err) {
            toast.error("Unable to open payment link in this environment");
            return;
          }
        }

        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: user.email,
          amount: amount * 100,
          ref: reference,
          onClose: () => toast.info("Payment window closed"),
          callback: async (response) => {
            const verify = await authenticatedFetch(`/api/payments/verify?reference=${response.reference}`).then((r) => r.json());
            if (verify.data?.verified) {
              toast.success("Payment confirmed!");
              setFees((prev) => prev.map((f) => f.id === fee.id ? { ...f, is_paid: true, paid_amount: amount } : f));
            } else {
              toast.error("Could not verify payment");
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

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" />

      <div>
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>My Fees</h1>
            <p>View and pay outstanding school fees.</p>
          </div>
        </div>

        {totalDue > 0 && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 16, padding: "2rem 2.5rem", marginBottom: "3rem", fontSize: "1.5rem", color: "#9a3412" }}>
            ⚠️ You have an outstanding balance of <strong>₦{totalDue.toLocaleString()}</strong>.
          </div>
        )}

        {loading ? (
          <div className="table-empty">Loading fees…</div>
        ) : fees.length === 0 ? (
          <div className="table-empty">No fee schedules assigned to you.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {fees.map((fee) => {
              const amount = fee.total_amount ?? fee.amount ?? 0;
              const paid = fee.paid_amount ?? 0;
              const outstanding = amount - paid;
              const isPaid = fee.is_paid || outstanding <= 0;
              return (
                <div key={fee.id} style={{ background: "white", border: `1px solid ${isPaid ? "#dcfce7" : "#fef3c7"}`, borderRadius: 16, padding: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>{fee.title ?? fee.name}</h3>
                    <div style={{ display: "flex", gap: "2rem", fontSize: "1.3rem", color: "#64748b" }}>
                      <span>Total: <strong>₦{amount.toLocaleString()}</strong></span>
                      {paid > 0 && <span>Paid: <strong style={{ color: "#22c55e" }}>₦{paid.toLocaleString()}</strong></span>}
                      {!isPaid && <span>Balance: <strong style={{ color: "#ef4444" }}>₦{outstanding.toLocaleString()}</strong></span>}
                      {fee.due_date && <span>Due: {new Date(fee.due_date).toLocaleDateString("en-NG")}</span>}
                    </div>
                  </div>
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
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
