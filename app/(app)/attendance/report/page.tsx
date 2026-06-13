"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface StudentAttendance {
  student_id: string;
  student_name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendanceRate: string;
}

interface ReportData {
  className: string;
  totalSchoolDays: number;
  averageAttendanceRate: string;
  studentBreakdown: StudentAttendance[];
}

export default function AttendanceReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get("classId");
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) {
      toast.error("Class ID is required");
      router.push("/attendance");
      return;
    }

    setLoading(true);
    authenticatedFetch(`/api/attendance/report/${classId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setReport(d.data);
        } else {
          toast.error("No report data available");
        }
      })
      .catch(() => {
        toast.error("Failed to load attendance report");
      })
      .finally(() => setLoading(false));
  }, [classId, router]);

  if (loading) {
    return <div className="table-empty">Loading report…</div>;
  }

  if (!report) {
    return <div className="table-empty">No attendance data available for this class.</div>;
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Attendance Report: {report.className}</h1>
          <p>Overall attendance summary and student breakdown.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Total School Days", value: report.totalSchoolDays, icon: "📅", color: "#6A5ACD" },
          { label: "Average Attendance Rate", value: `${report.averageAttendanceRate}%`, icon: "📊", color: "#22c55e" },
          { label: "Students", value: report.studentBreakdown.length, icon: "👥", color: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #f1f5f9",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.4rem", marginBottom: "0.8rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Student breakdown table */}
      <div className="premium-table-card">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Total Days</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            {report.studentBreakdown.map((student) => (
              <tr key={student.student_id}>
                <td>
                  <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{student.student_name}</span>
                </td>
                <td>
                  <span style={{ color: "#22c55e", fontWeight: 600 }}>{student.present}</span>
                </td>
                <td>
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>{student.absent}</span>
                </td>
                <td>
                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>{student.late}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{student.total}</span>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 700,
                      color: parseFloat(student.attendanceRate) >= 75 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {student.attendanceRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
