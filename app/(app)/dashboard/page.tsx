"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { useAppSelector } from "@/redux/hooks";
import { useActiveServices } from "@/lib/hooks/useActiveServices";

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
  recentPayments?: { id: string; student_name: string; amount: number; time: string }[];
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
  { href: "/attendance",            icon: "✅", label: "Attendance",      serviceSlug: "attendance" },
  { href: "/exams/create",          icon: "📝", label: "Create Exam",     serviceSlug: "exams" },
  { href: "/fees/collection",       icon: "💰", label: "Record Payment",  serviceSlug: "fees" },
  { href: "/announcements/create",  icon: "📢", label: "Announcement",    serviceSlug: "announcements" },
  { href: "/lesson-plans",          icon: "📋", label: "Lesson Plans",    serviceSlug: "lesson-plans" },
  { href: "/timetable",             icon: "🗓️",  label: "Timetable",       serviceSlug: "timetable" },
  { href: "/classes",               icon: "🏫", label: "Classes" },
  { href: "/analytics",             icon: "📈", label: "Analytics",       serviceSlug: "analytics" },
  { href: "/broadsheet",            icon: "📄", label: "Broadsheet",      serviceSlug: "results" },
  { href: "/library",               icon: "📖", label: "Library",         serviceSlug: "library" },
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
  const { hasService } = useActiveServices();
  const [stats, setStats] = useState<Stats | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authenticatedFetch("/api/analytics/dashboard")
        .then((r) => r.json())
        .then((d) => setStats(d.data ?? d))
        .catch((err) => console.error("Dashboard stats fetch failed:", err)),
      authenticatedFetch("/api/school")
        .then((r) => r.json())
        .then((d) => setSchool(d.data ?? d))
        .catch((err) => console.error("School fetch failed:", err)),
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
    <div className="dashboard-page">
      {/* Welcome section */}
      <div className="dashboard-welcome">
        <div>
          <h1>{`Welcome back, ${displayName}`}</h1>
          <p>
            {school?.name ?? "School dashboard"}
            {termLabel && sessionLabel ? ` · ${termLabel}, ${sessionLabel}` : ""}
          </p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link href="/announcements/create" className="btn-dashboard-outline">
            New announcement
          </Link>
          <Link href="/analytics" className="btn-dashboard-primary">
            View analytics
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <span style={{ fontSize: "3rem" }}>⏳</span>
          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          {/* Stats grid - 3 columns */}
          <section className="stats-grid-dashboard stats-grid-dashboard-3" style={{ marginBottom: "3rem" }}>
            <StatCard label="Students"   value={stats?.totalStudents}  icon="👥" href="/students" />
            <StatCard label="Teachers"   value={stats?.totalTeachers}  icon="🎓" href="/teachers" />
            <StatCard label="Parents"    value={stats?.totalParents}   icon="👪" href="/parents" />
            <StatCard label="Classes"    value={stats?.totalClasses}   icon="🏫" href="/classes" />
            {hasService("attendance") && (
              <StatCard
                label="Attendance"
                value={stats?.avgAttendance != null ? `${stats.avgAttendance}%` : "—"}
                sub="School average"
                icon="✅"
                isSuccess={(stats?.avgAttendance ?? 0) >= 75}
                href="/attendance"
              />
            )}
            {hasService("fees") && (
              <StatCard
                label="Fee collection"
                value={stats?.collectionRate != null ? `${stats.collectionRate}%` : "—"}
                sub={formatNaira(stats?.feeCollected)}
                icon="💳"
                href="/fees/collection"
              />
            )}
            {hasService("fees") && (
              <StatCard
                label="Fee defaulters"
                value={stats?.feeDefaulters}
                icon="💸"
                isDanger={(stats?.feeDefaulters ?? 0) > 0}
                href="/fees/defaulters"
              />
            )}
            {hasService("subjects") && (
              <StatCard label="Subjects" value={stats?.totalSubjects} icon="📚" href="/subjects" />
            )}
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main-content">
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
                          <span>{p.student_name}</span>
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

              <div className="panel-card">
                <div className="panel-card-header">
                  <h2>Academic pulse</h2>
                </div>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "1.2rem" }}>
                  Performance & curriculum readiness
                </p>
                <div className="academic-metrics">
                  <div className="academic-metric">
                    <span>Lesson plans approved</span>
                    <strong>0%</strong>
                  </div>
                  <div className="academic-metric">
                    <span>Pending approvals</span>
                    <strong>0</strong>
                  </div>
                  <div className="academic-metric">
                    <span>Upcoming exams</span>
                    <strong>0</strong>
                  </div>
                </div>
                <div className="curriculum-coverage">
                  <h4>Curriculum coverage</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>No class performance data yet</p>
                </div>
                <Link href="/results" className="view-all-link">
                  View all results →
                </Link>
              </div>
            </div>

            <div className="dashboard-sidebar">
              <div className="quick-controls-card">
                <h3>Quick controls</h3>
                <div className="quick-controls-grid">
                  {QUICK_ACTIONS
                    .filter((a) => !a.serviceSlug || hasService(a.serviceSlug))
                    .map((a) => (
                      <Link key={a.href} href={a.href} className="quick-control-btn">
                        <span>{a.icon}</span>
                        <span>{a.label}</span>
                      </Link>
                    ))
                  }
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-header">
                  <h2>Recent announcements</h2>
                </div>
                {stats?.recentAnnouncements?.length ? (
                  <ul className="announcements-list">
                    {stats.recentAnnouncements.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <Link href={`/announcements/${a.id}`}>
                          {a.title}
                        </Link>
                        <p>
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
                <Link href="/announcements" className="view-all-link">
                  View all announcements →
                </Link>
              </div>
            </div>
          </div>

          {/* AI Tools section */}
          <section className="ai-tools-section">
            <h2>✨ AI tools</h2>
            <div className="ai-tools-grid">
              <div className="ai-tool-card">
                <span className="ai-tool-icon">📝</span>
                <h4>Generate lesson plan</h4>
                <p>Curriculum-aligned plans in seconds</p>
              </div>
              <div className="ai-tool-card">
                <span className="ai-tool-icon">❓</span>
                <h4>AI question bank</h4>
                <p>Exam questions by class and difficulty</p>
              </div>
              <div className="ai-tool-card">
                <span className="ai-tool-icon">🗓️</span>
                <h4>Generate timetable</h4>
                <p>Auto-build schedules from constraints</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
