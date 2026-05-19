"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface Child {
  id: string; name: string; class_name?: string; admission_no?: string; avatar?: string;
}
interface RecentResult { subject_name: string; score?: number; grade?: string; term: string; }
interface Attendance { status: string; date: string; }

export default function ParentDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [children, setChildren] = useState<Child[]>([]);
  const [results, setResults] = useState<RecentResult[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>("");

  useEffect(() => {
    fetch("/api/parents/children", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list: Child[] = Array.isArray(d.data) ? d.data : [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0].id);
      })
      .catch(() => toast.error("Failed to load children"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    Promise.all([
      fetch(`/api/results/parent/${selectedChild}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/attendance/student/${selectedChild}`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([rd, ad]) => {
      setResults(Array.isArray(rd.data) ? rd.data.slice(0, 5) : []);
      setAttendance(Array.isArray(ad.data) ? ad.data.slice(0, 5) : []);
    }).catch(() => {});
  }, [selectedChild]);

  const child = children.find((c) => c.id === selectedChild);
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Parent Dashboard</h1>
          <p>Welcome, {(user as Record<string, unknown>)?.name as string ?? "Parent"}. Monitor your child's progress.</p>
        </div>
        {children.length > 1 && (
          <div className="header-actions">
            <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} style={{ padding: "0.8rem 1.5rem", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="table-empty">Loading…</div>
      ) : children.length === 0 ? (
        <div style={{ textAlign: "center", padding: "6rem", color: "#64748b", fontSize: "1.6rem" }}>
          No children linked to your account. Contact the school admin.
        </div>
      ) : (
        <>
          {/* Child info card */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", padding: "3rem", marginBottom: "3rem", display: "flex", gap: "2.5rem", alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#ede9fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.8rem", fontWeight: 800, color: "#6A5ACD", flexShrink: 0 }}>
              {child?.name?.[0] ?? "?"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", flex: 1 }}>
              {[
                ["Name", child?.name ?? "—"],
                ["Class", child?.class_name ?? "—"],
                ["Admission No.", child?.admission_no ?? "—"],
                ["Attendance (recent)", `${attendanceRate}%`],
                ["Subjects with results", String(results.length)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#334155" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            {/* Recent results */}
            <div className="form-card">
              <div className="form-section-title">Recent Results</div>
              {results.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No results yet this term.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.4rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "0.8rem 0", color: "#64748b", fontWeight: 700 }}>Subject</th>
                      <th style={{ textAlign: "center", padding: "0.8rem", color: "#64748b", fontWeight: 700 }}>Score</th>
                      <th style={{ textAlign: "center", padding: "0.8rem", color: "#64748b", fontWeight: 700 }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "1rem 0" }}>{r.subject_name}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{r.score ?? "—"}</td>
                        <td style={{ textAlign: "center" }}>{r.grade ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent attendance */}
            <div className="form-card">
              <div className="form-section-title">Recent Attendance</div>
              {attendance.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "1.4rem" }}>No attendance records yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {attendance.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid #f8fafc", fontSize: "1.4rem" }}>
                      <span>{new Date(a.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</span>
                      <span className={`badge ${a.status === "present" ? "badge-green" : a.status === "late" ? "badge-yellow" : "badge-red"}`}>
                        {a.status}
                      </span>
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
