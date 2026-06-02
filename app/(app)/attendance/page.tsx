"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface ClassItem { id: string; name: string; section?: string; }
interface AttendanceRecord {
  student_id: string;
  name: string;
  admission_no?: string;
  status: "present" | "absent" | "late";
  note?: string;
}

const today = new Date().toISOString().slice(0, 10);

export default function AttendancePage() {

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const list: ClassItem[] = Array.isArray(d.data) ? d.data : [];
        setClasses(list);
        if (list.length) setSelectedClass(list[0].id);
      })
      .catch(() => toast.error("Failed to load classes"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    authenticatedFetch(`/api/attendance/${selectedClass}?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => {
        const roster = Array.isArray(d.data) ? d.data : d.data?.records ?? [];
        setStudents(
          roster.map((s: AttendanceRecord) => ({
            student_id: s.student_id,
            name: s.name,
            admission_no: s.admission_no,
            status: s.status ?? "present",
            note: s.note ?? "",
          }))
        );
      })
      .catch(() => { toast.error("Failed to load roster"); setStudents([]); })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const setStatus = (id: string, status: AttendanceRecord["status"]) =>
    setStudents((prev) =>
      prev.map((s) => (s.student_id === id ? { ...s, status } : s))
    );

  const setNote = (id: string, note: string) =>
    setStudents((prev) =>
      prev.map((s) => (s.student_id === id ? { ...s, note } : s))
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          records: students.map((s) => ({
            studentId: s.student_id,
            status: s.status,
            note: s.note,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Attendance saved!");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleNotify = async () => {
    const absent = students.filter((s) => s.status === "absent");
    if (!absent.length) { toast.info("No absent students"); return; }
    setNotifying(true);
    try {
      await authenticatedFetch("/api/attendance/notify-absent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          studentIds: absent.map((s) => s.student_id),
        }),
      });
      toast.success(`Notified parents of ${absent.length} absent student(s)`);
    } catch {
      toast.error("Failed to send notifications");
    } finally {
      setNotifying(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const className = classes.find((c) => c.id === selectedClass)?.name ?? "";

  return (
    <ServiceGate slug="attendance">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Attendance</h1>
          <p>Mark and track daily student attendance by class.</p>
        </div>
        <div className="header-actions">
          <Link href={`/attendance/report?classId=${selectedClass}`} className="btn-outline">
            📊 Report
          </Link>
          <button
            className="btn-outline"
            onClick={handleNotify}
            disabled={notifying || absentCount === 0}
          >
            {notifying ? "Sending…" : "📩 Notify Parents"}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !students.length}>
            {saving ? "Saving…" : "✓ Save Attendance"}
          </button>
        </div>
      </div>

      {/* Class & date selectors */}
      <div className="filter-bar">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>CLASS</label>
          <select
            className="filter-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` ${c.section}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>DATE</label>
          <input
            type="date"
            className="filter-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Total", value: students.length, icon: "👥", color: "#6A5ACD" },
          { label: "Present", value: presentCount, icon: "✅", color: "#22c55e" },
          { label: "Absent", value: absentCount, icon: "❌", color: "#ef4444" },
          { label: "Late", value: lateCount, icon: "🕒", color: "#f59e0b" },
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
            <div style={{ fontSize: "3rem", fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Attendance roster */}
      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading roster for {className}…</div>
        ) : students.length === 0 ? (
          <div className="table-empty">
            No students found for this class on {selectedDate}.
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Status</th>
                <th>Note (optional)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td>
                    <div className="info-cell">
                      <div className="avatar-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`}
                          alt=""
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span className="mono">{s.admission_no ?? "—"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.8rem" }}>
                      {(["present", "absent", "late"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatus(s.student_id, status)}
                          style={{
                            padding: "0.6rem 1.4rem",
                            borderRadius: 8,
                            border: "2px solid",
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            borderColor:
                              s.status === status
                                ? status === "present"
                                  ? "#22c55e"
                                  : status === "absent"
                                  ? "#ef4444"
                                  : "#f59e0b"
                                : "#e2e8f0",
                            background:
                              s.status === status
                                ? status === "present"
                                  ? "#f0fdf4"
                                  : status === "absent"
                                  ? "#fff1f2"
                                  : "#fffbeb"
                                : "white",
                            color:
                              s.status === status
                                ? status === "present"
                                  ? "#16a34a"
                                  : status === "absent"
                                  ? "#dc2626"
                                  : "#b45309"
                                : "#94a3b8",
                          }}
                        >
                          {status[0].toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Optional note…"
                      value={s.note ?? ""}
                      onChange={(e) => setNote(s.student_id, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.8rem 1.2rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: "1.3rem",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {students.length > 0 && (
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: "1.6rem", padding: "1.4rem 3rem" }}>
            {saving ? "Saving…" : "✓ Save Attendance"}
          </button>
        </div>
      )}
    </div>
      </ServiceGate>
  );
}
