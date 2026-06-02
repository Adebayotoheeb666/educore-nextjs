"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface BillingRecord {
  id: string;
  service_name?: string;
  amount?: number;
  status?: string;
  description?: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  base_price?: number;
  is_compulsory?: number;
  active?: boolean;
}

export default function BillingPage() {
  const [history, setHistory] = useState<BillingRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "services">("services");

  useEffect(() => {
    Promise.all([
      authenticatedFetch("/api/billing").then((r) => r.json()),
      authenticatedFetch("/api/services").then((r) => r.json()),
    ])
      .then(([bd, sd]) => {
        setHistory(Array.isArray(bd.data) ? bd.data : []);
        // Normalize services: API returns `subscription_status` and `is_compulsory`.
        const rawServices = Array.isArray(sd.data) ? sd.data : [];
        const norm = rawServices.map((s: any) => ({
          ...s,
          active: Boolean(s.is_compulsory) || s.subscription_status === "active",
        }));
        setServices(norm);
      })
      .catch(() => toast.error("Failed to load billing"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (slug: string) => {
    try {
      const res = await authenticatedFetch("/api/services/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`${slug} activated`);
      setServices((prev) => prev.map((s) => s.slug === slug ? { ...s, active: true } : s));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to activate service");
    }
  };

  const totalSpent = history.filter((r) => r.status === "paid").reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Billing & Services</h1>
          <p>Manage your school&apos;s subscribed services and view billing history.</p>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: "#f3f0ff", border: "1px solid #c4b5fd", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", display: "flex", gap: "4rem" }}>
        <div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#5b21b6", textTransform: "uppercase" }}>Total Billed</div>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, color: "#6A5ACD" }}>₦{totalSpent.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#5b21b6", textTransform: "uppercase" }}>Active Services</div>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, color: "#6A5ACD" }}>{services.filter((s) => s.active).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {(["services", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: "0.9rem 2rem", borderRadius: 10, border: "none", fontWeight: 700, fontSize: "1.4rem", cursor: "pointer", background: activeTab === tab ? "#6A5ACD" : "#f1f5f9", color: activeTab === tab ? "white" : "#475569", textTransform: "capitalize" }}
          >
            {tab === "services" ? "🧩 Services" : "🧾 Billing History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-empty">Loading…</div>
      ) : activeTab === "services" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                background: "white",
                borderRadius: 16,
                border: s.active ? "2px solid #6A5ACD" : "1px solid #f1f5f9",
                padding: "2.5rem",
                position: "relative",
              }}
            >
              {s.is_compulsory ? (
                <span className="badge badge-blue" style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>Required</span>
              ) : s.active ? (
                <span className="badge badge-green" style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>Active</span>
              ) : null}
              <h3 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.8rem" }}>{s.name}</h3>
              {s.description && <p style={{ fontSize: "1.3rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.5 }}>{s.description}</p>}
              <div style={{ fontWeight: 800, fontSize: "2rem", color: s.base_price ? "#6A5ACD" : "#22c55e", marginBottom: "1.5rem" }}>
                {s.base_price ? `₦${Number(s.base_price).toLocaleString()}/mo` : "Free"}
              </div>
              {!s.is_compulsory && !s.active && (
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleSubscribe(s.slug)}>
                  Activate
                </button>
              )}
              {s.active && !s.is_compulsory && (
                <div style={{ color: "#6A5ACD", fontWeight: 700, fontSize: "1.3rem", textAlign: "center" }}>✓ Subscribed</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-table-card">
          {history.length === 0 ? (
            <div className="table-empty">No billing history yet.</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.service_name ?? "—"}</td>
                    <td style={{ fontWeight: 700, color: "#6A5ACD" }}>₦{(Number(r.amount) || 0).toLocaleString()}</td>
                    <td><span className={`badge ${r.status === "paid" ? "badge-green" : r.status === "failed" ? "badge-red" : "badge-yellow"}`}>{r.status ?? "pending"}</span></td>
                    <td>{r.description ?? "—"}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
