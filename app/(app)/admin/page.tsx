"use client";
import { useEffect, useRef, useState } from "react";
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
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const testEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d.data ?? d))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: testEmailTo || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? "Failed");
      toast.success(d.data?.message ?? "Test email sent");
      setTestEmailTo("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Email send failed");
    } finally {
      setSendingTest(false);
    }
  };

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

          {/* System tools */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem", marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>System Tools</h2>
            <p style={{ color: "#64748b", fontSize: "1.3rem", marginBottom: "2rem" }}>Test platform integrations and configuration.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {/* Email test */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "1.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>📧</span>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: "1.4rem" }}>SMTP Email Test</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "1.2rem" }}>Verify email delivery is working</p>
                  </div>
                </div>
                <form onSubmit={handleTestEmail} style={{ display: "flex", gap: "0.8rem" }}>
                  <input
                    ref={testEmailRef}
                    type="email"
                    placeholder="Recipient (leave blank for your email)"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    style={{ flex: 1, padding: "0.8rem 1.2rem", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "1.3rem" }}
                  />
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="btn-primary"
                    style={{ padding: "0.8rem 1.6rem", whiteSpace: "nowrap" }}
                  >
                    {sendingTest ? "Sending…" : "Send Test"}
                  </button>
                </form>
              </div>
              {/* DB health placeholder */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "1.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>🗄️</span>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: "1.4rem" }}>Database</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "1.2rem" }}>Turso / SQLite edge DB</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <span style={{ fontSize: "1.3rem", color: "#16a34a", fontWeight: 600 }}>Connected — data loaded successfully</span>
                </div>
              </div>
            </div>
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
