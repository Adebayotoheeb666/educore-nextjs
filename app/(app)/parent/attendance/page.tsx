"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Child { id: string; name: string; class_name?: string; }
interface AttendanceRecord { id: string; date: string; status: string; notes?: string; class_name?: string; term?: string; }

const STATUS_BADGE: Record<string, string> = {
  present: "badge-green",
  absent: "badge-red",
  late: "badge-yellow",
  excused: "badge-blue",
};

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch("/api/parents/children")
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
    authenticatedFetch(`/api/attendance/student/${selectedChild}`)
      .then((r) => r.json())
      .then((d) => setRecords(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load attendance"));
  }, [selectedChild]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [records]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Attendance Record</h1>
          <p>View your child's attendance history.</p>
        </div>
        {children.length > 1 && (
          <div className="header-actions">
            <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
              style={{ padding: "0.8rem 1.5rem", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "1.4rem" }}>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Total Days", value: stats.total, color: "#6A5ACD" },
          { label: "Present", value: stats.present, color: "#22c55e" },
          { label: "Absent", value: stats.absent, color: "#ef4444" },
          { label: "Attendance Rate", value: `${stats.rate}%`, color: stats.rate >= 75 ? "#22c55e" : "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2rem" }}>
            <div style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading attendance…</div>
        ) : records.length === 0 ? (
          <div className="table-empty">No attendance records yet.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Class</th>
                <th>Term</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>
                    {new Date(r.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-gray"}`}>{r.status}</span>
                  </td>
                  <td>{r.class_name ?? "—"}</td>
                  <td>{r.term ?? "—"}</td>
                  <td style={{ color: "#64748b", fontSize: "1.3rem" }}>{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
