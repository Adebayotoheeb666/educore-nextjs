"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface TimetableEntry {
  id: string; day: string; start_time: string; end_time: string;
  subject_name?: string; teacher_name?: string; room?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function StudentTimetablePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timetable/my", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load timetable"))
      .finally(() => setLoading(false));
  }, []);

  const byDay = (day: string) => entries.filter((e) => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Timetable</h1>
          <p>Weekly class schedule for {(user as Record<string, unknown>)?.name as string ?? "you"}.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading timetable…</div>
      ) : entries.length === 0 ? (
        <div className="table-empty">No timetable set for your class yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5rem" }}>
          {DAYS.map((day) => {
            const slots = byDay(day);
            return (
              <div key={day}>
                <div style={{ background: "#6A5ACD", color: "white", padding: "1rem", borderRadius: "10px 10px 0 0", textAlign: "center", fontWeight: 700, fontSize: "1.4rem" }}>
                  {day}
                </div>
                <div style={{ background: "white", border: "1px solid #f1f5f9", borderTop: "none", borderRadius: "0 0 10px 10px", minHeight: 200 }}>
                  {slots.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "1.3rem" }}>Free</div>
                  ) : (
                    slots.map((e) => (
                      <div key={e.id} style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid #f8fafc" }}>
                        <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.3rem" }}>{e.subject_name ?? "—"}</div>
                        <div style={{ fontSize: "1.2rem", color: "#64748b" }}>{e.start_time} – {e.end_time}</div>
                        {e.teacher_name && <div style={{ fontSize: "1.1rem", color: "#94a3b8" }}>{e.teacher_name}</div>}
                        {e.room && <div style={{ fontSize: "1.1rem", color: "#94a3b8" }}>Room {e.room}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
