"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface Result { subject_name: string; score?: number; grade?: string; term: string; }
interface Attendance { status: string; date: string; }
interface Announcement { id: string; title: string; created_at: string; }
interface ClassInfo { class_name: string; class_level: string; class_section: string; }
interface Subject { id: string; name: string; teacher_name?: string; }
interface FeeData { total_fees: number; total_paid: number; balance: number; }
interface Timetable { day: string; time_start: string; time_end: string; subject_name: string; class_name: string; }
interface LibraryBook { book_title: string; borrow_date: string; due_date: string; status: string; }

export default function StudentDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fees, setFees] = useState<FeeData | null>(null);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      authenticatedFetch(`/api/results/parent/${user.id}`).then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch(`/api/attendance/student/${user.id}`).then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch("/api/announcements").then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch(`/api/students/${user.id}/enrollments`).then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch(`/api/students/${user.id}/subjects`).then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch("/api/fees/student").then((r) => r.json()).catch(() => ({ data: null })),
      authenticatedFetch("/api/timetable/my").then((r) => r.json()).catch(() => ({ data: [] })),
      authenticatedFetch("/api/library/borrows").then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([rd, ad, nd, ed, sd, fd, td, ld]) => {
      setResults(Array.isArray(rd.data) ? rd.data.slice(0, 6) : []);
      setAttendance(Array.isArray(ad.data) ? ad.data.slice(0, 10) : []);
      setAnnouncements(Array.isArray(nd.data) ? nd.data.slice(0, 4) : []);
      
      // Get most recent enrollment (current class)
      if (Array.isArray(ed.data) && ed.data.length > 0) {
        setClassInfo({
          class_name: ed.data[0].class_name || "—",
          class_level: ed.data[0].class_level || "—",
          class_section: ed.data[0].class_section || "—",
        });
      }
      
      setSubjects(Array.isArray(sd.data) ? sd.data.slice(0, 10) : []);
      
      if (fd.data) {
        setFees({
          total_fees: fd.data.total_fees || 0,
          total_paid: fd.data.total_paid || 0,
          balance: (fd.data.total_fees || 0) - (fd.data.total_paid || 0),
        });
      }
      
      setTimetable(Array.isArray(td.data) ? td.data.slice(0, 12) : []);
      setLibraryBooks(Array.isArray(ld.data) ? ld.data.slice(0, 5) : []);
    }).catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const avg = results.filter((r) => r.score != null).length > 0
    ? (results.filter((r) => r.score != null).reduce((s, r) => s + (Number(r.score) || 0), 0) / results.filter((r) => r.score != null).length).toFixed(1)
    : "—";
  const feeBalance = fees ? (fees.balance > 0 ? `₦${fees.balance.toLocaleString()}` : "Fully Paid") : "—";
  const overdueBooks = libraryBooks.filter((b) => b.status === "overdue").length;

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
          {/* Class & Student Info Card */}
          {classInfo && (
            <div style={{ background: "linear-gradient(135deg, #6A5ACD 0%, #8b7dd9 100%)", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem", color: "white" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3rem" }}>
                <div>
                  <div style={{ fontSize: "1.2rem", opacity: 0.9, marginBottom: "0.5rem" }}>Your Class</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800 }}>{classInfo.class_level} {classInfo.class_section}</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.2rem", opacity: 0.9, marginBottom: "0.5rem" }}>Academic Session</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800 }}>2024/2025</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.2rem", opacity: 0.9, marginBottom: "0.5rem" }}>Current Term</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800 }}>First Term</div>
                </div>
              </div>
            </div>
          )}

          {/* Key Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
            {[
              { label: "Average Score", value: avg, color: "#6A5ACD", icon: "📊" },
              { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 80 ? "#22c55e" : "#f59e0b", icon: "📅" },
              { label: "Subjects", value: String(subjects.length), color: "#3b82f6", icon: "📚" },
              { label: "Fee Balance", value: feeBalance, color: fees && fees.balance <= 0 ? "#22c55e" : "#ef4444", icon: "💰" },
              { label: "Overdue Books", value: String(overdueBooks), color: overdueBooks > 0 ? "#ef4444" : "#22c55e", icon: "📖" },
              { label: "Results", value: String(results.length), color: "#8b5cf6", icon: "✅" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ background: "white", borderRadius: 12, border: "1px solid #f1f5f9", padding: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
                <div style={{ fontSize: "1rem", color: "#64748b", fontWeight: 600, marginBottom: "0.3rem" }}>{label}</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "3rem" }}>
            {/* Subjects & Teachers */}
            <div className="form-card">
              <div className="form-section-title">My Subjects</div>
              {subjects.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No subjects enrolled.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {subjects.map((s, i) => (
                    <div key={i} style={{ padding: "1rem", background: "#f8fafc", borderRadius: 8, borderLeft: "4px solid #6A5ACD" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.3rem" }}>{s.name}</div>
                      <div style={{ fontSize: "1.2rem", color: "#64748b" }}>👨‍🏫 {s.teacher_name || "TBD"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div className="form-card">
              <div className="form-section-title">My Recent Results</div>
              {results.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No results yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.3rem" }}>
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
                        <td style={{ padding: "0.8rem 0" }}>{r.subject_name}</td>
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
          </div>

          {/* Attendance & Announcements */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "3rem" }}>
            {/* Attendance */}
            <div className="form-card">
              <div className="form-section-title">📅 Attendance Records</div>
              {attendance.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No attendance records.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {attendance.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem", background: "#f8fafc", borderRadius: 6 }}>
                      <div style={{ fontSize: "1.3rem", color: "#475569" }}>{new Date(a.date).toLocaleDateString("en-NG")}</div>
                      <span className={`badge ${a.status === "present" ? "badge-green" : a.status === "absent" ? "badge-red" : "badge-yellow"}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Announcements */}
            <div className="form-card">
              <div className="form-section-title">📢 Announcements</div>
              {announcements.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No recent announcements.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {announcements.map((a) => (
                    <div key={a.id} style={{ padding: "1rem", background: "#f8fafc", borderRadius: 8, borderLeft: "4px solid #6A5ACD" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.3rem" }}>{a.title}</div>
                      <div style={{ fontSize: "1.2rem", color: "#94a3b8" }}>{new Date(a.created_at).toLocaleDateString("en-NG")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timetable */}
          <div className="form-card" style={{ marginBottom: "3rem" }}>
            <div className="form-section-title">⏰ Weekly Timetable</div>
            {timetable.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No timetable scheduled.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.3rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.8rem", color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>Day</th>
                    <th style={{ textAlign: "left", padding: "0.8rem", color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>Time</th>
                    <th style={{ textAlign: "left", padding: "0.8rem", color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>Subject</th>
                    <th style={{ textAlign: "left", padding: "0.8rem", color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.8rem", fontWeight: 600 }}>{t.day}</td>
                      <td style={{ padding: "0.8rem" }}>{t.time_start} - {t.time_end}</td>
                      <td style={{ padding: "0.8rem", color: "#6A5ACD", fontWeight: 600 }}>{t.subject_name}</td>
                      <td style={{ padding: "0.8rem", color: "#64748b" }}>{t.class_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Library Books */}
          <div className="form-card">
            <div className="form-section-title">📖 Library Books</div>
            {libraryBooks.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No borrowed books.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {libraryBooks.map((b, i) => (
                  <div key={i} style={{ padding: "1.5rem", border: "1px solid #f1f5f9", borderRadius: 8, background: b.status === "overdue" ? "#fef2f2" : "#f8fafc" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.5rem", color: b.status === "overdue" ? "#dc2626" : "#1e293b" }}>
                      {b.book_title}
                    </div>
                    <div style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "0.3rem" }}>
                      📅 Borrowed: {new Date(b.borrow_date).toLocaleDateString("en-NG")}
                    </div>
                    <div style={{ fontSize: "1.2rem", color: b.status === "overdue" ? "#dc2626" : "#64748b" }}>
                      🔔 Due: {new Date(b.due_date).toLocaleDateString("en-NG")}
                    </div>
                    <span className={`badge ${b.status === "active" ? "badge-green" : "badge-red"}`} style={{ marginTop: "0.8rem", display: "inline-block" }}>
                      {b.status === "overdue" ? "⚠️ Overdue" : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
