"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { useAppSelector } from "@/redux/hooks";

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
                  <Link href="/students/add" className="quick-control-btn">
                    <span>➕</span>
                    <span>Add Student</span>
                  </Link>
                  <Link href="/teachers/add" className="quick-control-btn">
                    <span>👩‍🏫</span>
                    <span>Add Teacher</span>
                  </Link>
                  <Link href="/attendance" className="quick-control-btn">
                    <span>✅</span>
                    <span>Attendance</span>
                  </Link>
                  <Link href="/exams/create" className="quick-control-btn">
                    <span>📝</span>
                    <span>Create Exam</span>
                  </Link>
                  <Link href="/fees/collection" className="quick-control-btn">
                    <span>💰</span>
                    <span>Record Payment</span>
                  </Link>
                  <Link href="/announcements/create" className="quick-control-btn">
                    <span>📢</span>
                    <span>Announcement</span>
                  </Link>
                  <Link href="/lesson-plans" className="quick-control-btn">
                    <span>📋</span>
                    <span>Lesson Plans</span>
                  </Link>
                  <Link href="/timetable" className="quick-control-btn">
                    <span>🗓️</span>
                    <span>Timetable</span>
                  </Link>
                  <Link href="/classes" className="quick-control-btn">
                    <span>🏫</span>
                    <span>Classes</span>
                  </Link>
                  <Link href="/analytics" className="quick-control-btn">
                    <span>📈</span>
                    <span>Analytics</span>
                  </Link>
                  <Link href="/broadsheet" className="quick-control-btn">
                    <span>📄</span>
                    <span>Broadsheet</span>
                  </Link>
                  <Link href="/library" className="quick-control-btn">
                    <span>📖</span>
                    <span>Library</span>
                  </Link>
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
