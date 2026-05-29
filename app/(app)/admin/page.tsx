"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import "../shared.css";

interface AdminStats {
  totals?: {
    schools?: number;
    users?: number;
    students?: number;
    teachers?: number;
    revenue?: number;
    activeSchools?: number;
    inactiveSchools?: number;
    trialSchools?: number;
  };
  recentSchools?: { id: string; name: string; created_at: string; subscription_status?: string }[];
}

const fmt = (n?: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;

const QUICK_ACTIONS = [
  { href: "/admin/schools",  icon: "🏫", label: "All Schools" },
  { href: "/admin/users",    icon: "👥", label: "All Users" },
  { href: "/admin/blog",     icon: "📰", label: "Blog Posts" },
  { href: "/admin/payments", icon: "💳", label: "Payments" },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d.data ?? d))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);



  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Platform Overview</h1>
          <p>Super admin view of the entire EduCore platform.</p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "3rem" }}>
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} style={{ background: "white", borderRadius: 14, border: "1px solid #f1f5f9", padding: "2rem", textDecoration: "none", textAlign: "center", transition: "all 0.15s", display: "block" }}>
            <div style={{ fontSize: "2.8rem", marginBottom: "0.8rem" }}>{a.icon}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>{a.label}</div>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="table-empty">Loading platform data…</div>
      ) : (
        <>
          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
            {[
              { label: "Schools",    value: data?.totals?.schools,       icon: "🏫", color: "#3730a3" },
              { label: "Users",      value: data?.totals?.users,         icon: "👥", color: "#0369a1" },
              { label: "Students",   value: data?.totals?.students,      icon: "👨‍🎓", color: "#15803d" },
              { label: "Revenue",    value: fmt(data?.totals?.revenue),  icon: "💰", color: "#6A5ACD" },
            ].map((s) => (
              <div key={s.label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{s.label}</span>
                  <span style={{ fontSize: "2rem" }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: "3.2rem", fontWeight: 800, color: s.color }}>
                  {s.value?.toLocaleString?.() ?? s.value ?? "—"}
                </div>
              </div>
            ))}
          </div>



          {/* School status breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "2rem" }}>School Status</h2>
              {[
                { label: "Active",    value: data?.totals?.activeSchools,   color: "#22c55e" },
                { label: "Inactive",  value: data?.totals?.inactiveSchools, color: "#ef4444" },
                { label: "Trial",     value: data?.totals?.trialSchools,    color: "#f59e0b" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "1.4rem", color: "#475569", fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: "1.8rem", color: s.color }}>{s.value ?? 0}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "2rem" }}>Recent Schools</h2>
              {data?.recentSchools?.length ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {data.recentSchools.slice(0, 5).map((s) => (
                    <li key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid #f1f5f9" }}>
                      <Link href={`/admin/schools/${s.id}`} style={{ fontWeight: 700, fontSize: "1.4rem", color: "#0f172a", textDecoration: "none" }}>
                        {s.name}
                      </Link>
                      <span className={`badge ${s.subscription_status === "active" ? "badge-green" : "badge-gray"}`}>
                        {s.subscription_status ?? "trial"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#64748b", fontSize: "1.4rem" }}>No schools registered yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
