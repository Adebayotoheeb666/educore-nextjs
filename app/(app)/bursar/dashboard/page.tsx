"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";

export default function BursarDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    authenticatedFetch("/api/analytics/dashboard")
      .then((r) => r.json())
      .then((d) => { if (mounted) setData(d.data ?? d); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <h1>{`Bursar dashboard — ${user?.name ?? "Finance"}`}</h1>
          <p>Finance and fees management at a glance</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link href="/fees/collection" className="btn-dashboard-primary">Manage collections</Link>
          <Link href="/fees/schedules" className="btn-dashboard-outline">Fee schedules</Link>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading"><span style={{ fontSize: "3rem" }}>⏳</span><span>Loading…</span></div>
      ) : (
        <div style={{ padding: "1rem 0" }}>
          <section className="stats-grid-dashboard stats-grid-dashboard-3">
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Collected</h5>
                <h2>{data?.feeCollected != null ? `₦${Number(data.feeCollected).toLocaleString()}` : "—"}</h2>
                <p className="stat-card-sub">Recent collections</p>
              </div>
            </div>
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Outstanding</h5>
                <h2 className="text-warn">{data?.feePending != null ? `₦${Number(data.feePending).toLocaleString()}` : "—"}</h2>
                <p className="stat-card-sub">Pending payments</p>
              </div>
            </div>
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Defaulters</h5>
                <h2>{data?.feeDefaulters ?? 0}</h2>
                <p className="stat-card-sub">Students owing fees</p>
              </div>
            </div>
          </section>

          <div className="panel-card">
            <div className="panel-card-header">
              <h2>Recent payments</h2>
            </div>
            {data?.recentPayments?.length ? (
              <ul className="recent-payments-list">
                {data.recentPayments.map((p: any) => (
                  <li key={p.id}><span>{p.student_name}</span><span className="recent-pay-meta">₦{p.amount} · {p.time}</span></li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>No recent payments.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
