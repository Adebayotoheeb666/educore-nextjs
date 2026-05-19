"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface Result { subject_name: string; score?: number; grade?: string; term: string; }
interface Attendance { status: string; date: string; }
interface Announcement { id: string; title: string; created_at: string; }

export default function StudentDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch(`/api/results/parent/${user.id}`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/attendance/student/${user.id}`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/announcements", { credentials: "include" }).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([rd, ad, nd]) => {
      setResults(Array.isArray(rd.data) ? rd.data.slice(0, 6) : []);
      setAttendance(Array.isArray(ad.data) ? ad.data.slice(0, 10) : []);
      setAnnouncements(Array.isArray(nd.data) ? nd.data.slice(0, 4) : []);
    }).catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const avg = results.filter((r) => r.score != null).length > 0
    ? (results.filter((r) => r.score != null).reduce((s, r) => s + (Number(r.score) || 0), 0) / results.filter((r) => r.score != null).length).toFixed(1)
    : "—";

  const displayName = (user as Record<string, unknown>)?.name as string ?? "Student";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Dashboard</h1>
          <p>Welcome back, {displayName}!</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading…</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
            {[
              { label: "Average Score", value: avg, color: "#6A5ACD" },
              { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 80 ? "#22c55e" : "#f59e0b" },
              { label: "Subjects with Results", value: String(results.length), color: "#3b82f6" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
                <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.8rem" }}>{label}</div>
                <div style={{ fontSize: "3rem", fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            {/* Results */}
            <div className="form-card">
              <div className="form-section-title">My Recent Results</div>
              {results.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No results yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.4rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "0.8rem 0", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Subject</th>
                      <th style={{ textAlign: "center", padding: "0.8rem", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Score</th>
                      <th style={{ textAlign: "center", padding: "0.8rem", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "1rem 0" }}>{r.subject_name}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#6A5ACD" }}>{r.score ?? "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${(r.grade ?? "").startsWith("A") ? "badge-green" : (r.grade ?? "").startsWith("B") ? "badge-blue" : "badge-yellow"}`}>
                            {r.grade ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Announcements */}
            <div className="form-card">
              <div className="form-section-title">Announcements</div>
              {announcements.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No recent announcements.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {announcements.map((a) => (
                    <div key={a.id} style={{ padding: "1.2rem 0", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.3rem" }}>{a.title}</div>
                      <div style={{ fontSize: "1.2rem", color: "#94a3b8" }}>
                        {new Date(a.created_at).toLocaleDateString("en-NG")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
