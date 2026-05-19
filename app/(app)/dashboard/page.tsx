"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import ActionCard from "./ActionCard";

const formatNaira = (n?: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;

interface Stats {
  totalStudents?: number;
  totalTeachers?: number;
  totalParents?: number;
  totalClasses?: number;
  totalSubjects?: number;
  avgAttendance?: number;
  collectionRate?: number;
  feeCollected?: number;
  feePending?: number;
  feeDefaulters?: number;
  staffCount?: number;
  pendingLessonPlans?: number;
  overdueLibrary?: number;
  upcomingExams?: number;
  recentPayments?: { id: string; studentName: string; amount: number; time: string }[];
  recentAnnouncements?: { id: string; title: string; created_at: string }[];
  curriculumProgress?: number;
}

interface School {
  name?: string;
  settings?: { currentTerm?: string; academicSession?: string };
}

const ADMIN_ROLES = ["school_owner", "principal", "vp_academics", "vp_admin", "admin_staff"];

const QUICK_ACTIONS = [
  { href: "/students/add",          icon: "➕", label: "Add Student" },
  { href: "/teachers/add",          icon: "👩‍🏫", label: "Add Teacher" },
  { href: "/attendance",            icon: "✅", label: "Attendance" },
  { href: "/exams/create",          icon: "📝", label: "Create Exam" },
  { href: "/fees/collection",       icon: "💰", label: "Record Payment" },
  { href: "/announcements/create",  icon: "📢", label: "Announcement" },
  { href: "/lesson-plans",          icon: "📋", label: "Lesson Plans" },
  { href: "/timetable",             icon: "🗓️",  label: "Timetable" },
  { href: "/classes",               icon: "🏫", label: "Classes" },
  { href: "/analytics",             icon: "📈", label: "Analytics" },
  { href: "/broadsheet",            icon: "📄", label: "Broadsheet" },
  { href: "/library",               icon: "📖", label: "Library" },
];

function StatCard({
  label,
  value,
  sub,
  icon,
  isDanger,
  isSuccess,
  href,
}: {
  label: string;
  value?: string | number | null;
  sub?: string;
  icon: string;
  isDanger?: boolean;
  isSuccess?: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className={`stat-card-premium ${isDanger ? "danger" : ""} ${isSuccess ? "success" : ""} ${href ? "stat-card-link" : ""}`}
    >
      <div className="stat-card-header">
        <div className="stat-card-icon-wrap">{icon}</div>
      </div>
      <div className="stat-card-body">
        <h5>{label}</h5>
        <h2>{value ?? "—"}</h2>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="stat-card-anchor">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [stats, setStats] = useState<Stats | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/dashboard", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setStats(d.data ?? d))
        .catch(() => {}),
      fetch("/api/school", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setSchool(d.data ?? d))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const displayName =
    user?.name ||
    `${(user as any)?.firstName ?? ""} ${(user as any)?.lastName ?? ""}`.trim() ||
    "Admin";

  const termLabel = school?.settings?.currentTerm
    ? `${school.settings.currentTerm[0].toUpperCase()}${school.settings.currentTerm.slice(1)} Term`
    : null;
  const sessionLabel = school?.settings?.academicSession ?? null;

  const opsAlerts = [
    (stats?.feeDefaulters ?? 0) > 0 && {
      key: "fees",
      label: `${stats!.feeDefaulters} fee defaulter${stats!.feeDefaulters === 1 ? "" : "s"}`,
      href: "/fees/defaulters",
      tone: "warn",
    },
    (stats?.pendingLessonPlans ?? 0) > 0 && {
      key: "plans",
      label: `${stats!.pendingLessonPlans} lesson plan${stats!.pendingLessonPlans === 1 ? "" : "s"} awaiting approval`,
      href: "/lesson-plans",
      tone: "info",
    },
    (stats?.overdueLibrary ?? 0) > 0 && {
      key: "library",
      label: `${stats!.overdueLibrary} overdue library book${stats!.overdueLibrary === 1 ? "" : "s"}`,
      href: "/library",
      tone: "warn",
    },
    (stats?.upcomingExams ?? 0) > 0 && {
      key: "exams",
      label: `${stats!.upcomingExams} exam${stats!.upcomingExams === 1 ? "" : "s"} in the next 30 days`,
      href: "/exams",
      tone: "info",
    },
  ].filter(Boolean) as { key: string; label: string; href: string; tone: string }[];

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  return (
    <div>

      {/* Dashboard Action Card: Welcome + Quick Actions */}
      {isAdmin && (
        <ActionCard quickActions={QUICK_ACTIONS}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 0 }}>{`Welcome back, ${displayName}`}</h1>
            <p style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
              {school?.name ?? "School dashboard"}
              {termLabel && sessionLabel ? ` · ${termLabel}, ${sessionLabel}` : ""}
            </p>
          </div>
          <div className="welcome-actions">
            <Link href="/announcements/create" className="btn-dashboard-outline">
              New announcement
            </Link>
            <Link href="/analytics" className="btn-dashboard-primary">
              View analytics
            </Link>
          </div>
        </ActionCard>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <span style={{ fontSize: "3rem" }}>⏳</span>
          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <section className="stats-grid-dashboard stats-grid-dashboard-8" style={{ marginBottom: "3rem" }}>
            <StatCard label="Students"   value={stats?.totalStudents}  icon="👥" href="/students" />
            <StatCard label="Teachers"   value={stats?.totalTeachers}  icon="🎓" href="/teachers" />
            <StatCard label="Parents"    value={stats?.totalParents}   icon="👪" href="/parents" />
            <StatCard label="Classes"    value={stats?.totalClasses}   icon="🏫" href="/classes" />
            <StatCard
              label="Attendance"
              value={stats?.avgAttendance != null ? `${stats.avgAttendance}%` : "—"}
              sub="School average"
              icon="✅"
              isSuccess={(stats?.avgAttendance ?? 0) >= 75}
              href="/attendance"
            />
            <StatCard
              label="Fee collection"
              value={stats?.collectionRate != null ? `${stats.collectionRate}%` : "—"}
              sub={formatNaira(stats?.feeCollected)}
              icon="💳"
              href="/fees/collection"
            />
            <StatCard
              label="Fee defaulters"
              value={stats?.feeDefaulters}
              icon="💸"
              isDanger={(stats?.feeDefaulters ?? 0) > 0}
              href="/fees/defaulters"
            />
            <StatCard label="Subjects" value={stats?.totalSubjects} icon="📚" href="/subjects" />
          </section>

          <div className="dashboard-content-grid">
            <div className="main-column">
              {opsAlerts.length > 0 && (
                <div className="ops-alerts-card">
                  <h3>Needs attention</h3>
                  <ul className="ops-alerts-list">
                    {opsAlerts.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={`ops-alert-item ops-alert-${item.tone}`}
                        >
                          <span>{item.label}</span>
                          <span className="ops-alert-arrow">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="panel-card">
                <div className="panel-card-header">
                  <h2>Finance snapshot</h2>
                  <Link href="/fees/collection">Manage fees</Link>
                </div>
                <div className="finance-metrics">
                  <div className="finance-metric">
                    <span>Collected</span>
                    <strong>{formatNaira(stats?.feeCollected)}</strong>
                  </div>
                  <div className="finance-metric">
                    <span>Outstanding</span>
                    <strong className="text-warn">{formatNaira(stats?.feePending)}</strong>
                  </div>
                  <div className="finance-metric">
                    <span>Collection rate</span>
                    <strong>{stats?.collectionRate ?? 0}%</strong>
                  </div>
                  <div className="finance-metric">
                    <span>Staff (admin)</span>
                    <strong>{stats?.staffCount ?? "—"}</strong>
                  </div>
                </div>

                <div className="recent-payments-block">
                  <h4>Recent payments</h4>
                  {stats?.recentPayments?.length ? (
                    <ul className="recent-payments-list">
                      {stats.recentPayments.map((p) => (
                        <li key={p.id}>
                          <span>{p.studentName}</span>
                          <span className="recent-pay-meta">
                            {formatNaira(p.amount)}
                            <em>{p.time}</em>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "1.3rem" }}>
                      No recent payments.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Announcements */}
            <div className="side-column">
              <div className="panel-card">
                <div className="panel-card-header">
                  <h2>Announcements</h2>
                  <Link href="/announcements">View all</Link>
                </div>
                {stats?.recentAnnouncements?.length ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {stats.recentAnnouncements.slice(0, 5).map((a) => (
                      <li key={a.id} style={{ fontSize: "1.3rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
                        <Link
                          href={`/announcements/${a.id}`}
                          style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: 600 }}
                        >
                          {a.title}
                        </Link>
                        <p style={{ color: "var(--text-muted)", margin: "0.4rem 0 0", fontSize: "1.1rem" }}>
                          {new Date(a.created_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "1.3rem" }}>
                    No announcements yet.
                  </p>
                )}
                {isAdmin && (
                  <Link
                    href="/announcements/create"
                    className="btn-dashboard-primary"
                    style={{ marginTop: "2rem", display: "block", textAlign: "center" }}
                  >
                    + New Announcement
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
