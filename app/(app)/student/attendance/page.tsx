"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface AttendanceRecord {
  id: string;
  status: string;
  date: string;
  subject_name?: string;
  class_name?: string;
}

export default function StudentAttendancePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/attendance/student/${user.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAttendance(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load attendance"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const filtered = filterMonth
    ? attendance.filter((a) => new Date(a.date).toISOString().slice(0, 7) === filterMonth)
    : attendance;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Attendance</h1>
          <p>Track your attendance records and statistics.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Present", value: presentCount, color: "#22c55e", icon: "✅" },
          { label: "Absent", value: absentCount, color: "#ef4444", icon: "❌" },
          { label: "Late", value: lateCount, color: "#f59e0b", icon: "⏰" },
          { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 80 ? "#22c55e" : "#f59e0b", icon: "📊" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "white", borderRadius: 12, border: "1px solid #f1f5f9", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
            <div style={{ fontSize: "1rem", color: "#64748b", fontWeight: 600, marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar" style={{ marginBottom: "2rem" }}>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            padding: "0.8rem 1rem",
            borderRadius: 8,
            border: "1px solid #f1f5f9",
            fontSize: "1.3rem",
            cursor: "pointer",
          }}
        />
        {filterMonth && (
          <button
            onClick={() => setFilterMonth("")}
            style={{
              padding: "0.8rem 1.5rem",
              borderRadius: 8,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="table-empty">Loading attendance…</div>
      ) : filtered.length === 0 ? (
        <div className="table-empty">No attendance records found.</div>
      ) : (
        <div className="premium-table-card">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Subject</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td style={{ fontWeight: 600 }}>{new Date(record.date).toLocaleDateString("en-NG")}</td>
                  <td>
                    <span
                      className={`badge ${
                        record.status === "present"
                          ? "badge-green"
                          : record.status === "absent"
                          ? "badge-red"
                          : "badge-yellow"
                      }`}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td>{record.subject_name || "—"}</td>
                  <td>{record.class_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
