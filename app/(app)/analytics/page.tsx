"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  avgAttendance?: number;
  feeCollected?: number;
  feePending?: number;
  collectionRate?: number;
  feeDefaulters?: number;
  totalSubjects?: number;
  pendingLessonPlans?: number;
  overdueLibrary?: number;
  upcomingExams?: number;
  curriculumProgress?: number;
  staffCount?: number;
}

interface FeeAnalytics {
  paid?: number;
  pending?: number;
  overdue?: number;
  collectionRate?: number;
}

interface AttendanceAnalytics {
  thisWeek?: number;
  lastWeek?: number;
  trend?: string;
  byClass?: { class: string; rate: number }[];
}

const fmt = (n?: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const pct = (n?: number | null) => `${Number(n ?? 0).toFixed(1)}%`;

export default function AnalyticsPage() {

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [feeData, setFeeData] = useState<FeeAnalytics | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/dashboard", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/analytics/fees", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/analytics/attendance", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([d, f, a]) => {
        setDashboard(d.data ?? d);
        setFeeData(f.data ?? f);
        setAttendanceData(a.data ?? a);
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/analytics/emis-report?term=First+Term&session=2024/2025", {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("EMIS report export initiated");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading" style={{ minHeight: 400 }}>
        <span style={{ fontSize: "3rem" }}>⏳</span>
        <span>Loading analytics…</span>
      </div>
    );
  }

  return (
    <ServiceGate slug="analytics">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Analytics Overview</h1>
          <p>Real-time insights across attendance, fees, results, and more.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "📥 Export EMIS Report"}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics-grid">
        {[
          { label: "Students",    value: dashboard?.totalStudents?.toLocaleString() ?? "—", icon: "👨‍🎓", color: "#3730a3" },
          { label: "Teachers",    value: dashboard?.totalTeachers?.toLocaleString() ?? "—", icon: "👩‍🏫", color: "#0369a1" },
          { label: "Attendance",  value: pct(dashboard?.avgAttendance), icon: "✅", color: "#16a34a" },
          { label: "Fee Rate",    value: pct(dashboard?.collectionRate), icon: "💳", color: "#6A5ACD" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{s.label}</span>
              <span style={{ fontSize: "2.4rem" }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: "3.2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="analytics-two-col-grid">
        {/* Fee Breakdown */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "2rem" }}>Fee Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              { label: "Collected",   value: fmt(dashboard?.feeCollected), color: "#22c55e", pct: dashboard?.collectionRate },
              { label: "Outstanding", value: fmt(dashboard?.feePending),   color: "#f59e0b", pct: 100 - (dashboard?.collectionRate ?? 0) },
              { label: "Defaulters",  value: `${dashboard?.feeDefaulters ?? 0} students`, color: "#ef4444", pct: null },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 600, color: "#475569" }}>{item.label}</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
                {item.pct != null && (
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10 }}>
                    <div style={{ height: "100%", borderRadius: 10, background: item.color, width: `${Math.min(100, Math.max(0, item.pct))}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Summary */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "2rem" }}>Attendance Summary</h2>
          <div style={{ display: "flex", gap: "3rem", marginBottom: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#6A5ACD" }}>{pct(dashboard?.avgAttendance)}</div>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700 }}>SCHOOL AVERAGE</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", fontWeight: 800 }}>{dashboard?.totalClasses ?? "—"}</div>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700 }}>CLASSES</div>
            </div>
          </div>
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: (dashboard?.avgAttendance ?? 0) >= 75 ? "#22c55e" : "#ef4444",
                borderRadius: 10,
                width: `${dashboard?.avgAttendance ?? 0}%`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "1.2rem", color: "#64748b", marginTop: "1rem" }}>
            {(dashboard?.avgAttendance ?? 0) >= 75 ? "✅ Attendance rate is healthy." : "⚠️ Attendance rate is below target (75%)."}
          </p>

          {attendanceData?.byClass?.length ? (
            <div style={{ marginTop: "2rem" }}>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1rem" }}>By Class</h4>
              {attendanceData.byClass.slice(0, 5).map((c) => (
                <div key={c.class} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "1.3rem" }}>
                  <span style={{ color: "#475569" }}>{c.class}</span>
                  <span style={{ fontWeight: 700, color: c.rate >= 75 ? "#22c55e" : "#ef4444" }}>{c.rate}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Ops Alerts */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "2rem" }}>⚡ Action Required</h2>
        <div className="analytics-actions-grid">
          {[
            { label: "Fee Defaulters",        value: dashboard?.feeDefaulters,       icon: "💸", href: "/fees/defaulters",  color: "#e11d48" },
            { label: "Pending Lesson Plans",   value: dashboard?.pendingLessonPlans,  icon: "📝", href: "/lesson-plans",     color: "#f59e0b" },
            { label: "Overdue Library Books",  value: dashboard?.overdueLibrary,      icon: "📖", href: "/library",          color: "#d97706" },
            { label: "Upcoming Exams (30 days)",value: dashboard?.upcomingExams,      icon: "📋", href: "/exams",            color: "#1d4ed8" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{ display: "block", background: "#f8fafc", borderRadius: 12, padding: "2rem", textDecoration: "none", border: "1px solid #f1f5f9" }}
            >
              <div style={{ fontSize: "2.4rem", marginBottom: "0.8rem" }}>{item.icon}</div>
              <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: "2.8rem", fontWeight: 800, color: item.value ? item.color : "#64748b", marginTop: "0.5rem" }}>
                {item.value ?? 0}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
      </ServiceGate>
  );
}
