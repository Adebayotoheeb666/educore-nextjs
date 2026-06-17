"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";

export default function LibrarianDashboardPage() {
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
          <h1>{`Library dashboard — ${user?.name ?? "Librarian"}`}</h1>
          <p>Library operations and book management</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link href="/library" className="btn-dashboard-primary">Manage library</Link>
          <Link href="/library/borrows" className="btn-dashboard-outline">Borrow records</Link>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading"><span style={{ fontSize: "3rem" }}>⏳</span><span>Loading…</span></div>
      ) : (
        <div style={{ padding: "1rem 0" }}>
          <section className="stats-grid-dashboard stats-grid-dashboard-3">
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Overdue</h5>
                <h2>{data?.overdueLibrary ?? 0}</h2>
                <p className="stat-card-sub">Overdue books</p>
              </div>
            </div>
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Books</h5>
                <h2>{data?.totalBooks ?? "—"}</h2>
                <p className="stat-card-sub">Catalog size</p>
              </div>
            </div>
            <div className="stat-card-premium">
              <div className="stat-card-body">
                <h5>Active Borrows</h5>
                <h2>{data?.activeBorrows ?? "—"}</h2>
                <p className="stat-card-sub">Currently borrowed</p>
              </div>
            </div>
          </section>

          <div className="panel-card">
            <div className="panel-card-header"><h2>Recent borrows</h2></div>
            {data?.recentBorrows?.length ? (
              <ul className="announcements-list">
                {data.recentBorrows.map((b: any) => (
                  <li key={b.id}><strong>{b.title}</strong><p style={{ color: "var(--text-muted)" }}>{b.borrower_name} · {b.due_date}</p></li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>No recent borrows.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
