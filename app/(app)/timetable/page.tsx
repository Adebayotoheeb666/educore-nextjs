"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface TimetableSlot {
  id: string;
  day: string;
  start_time: string;
  end_time?: string;
  subject_name?: string;
  teacher_name?: string;
  class_name?: string;
  class_section?: string;
}

interface ClassItem { id: string; name: string; section?: string; }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TERMS = ["First Term", "Second Term", "Third Term"];

export default function TimetablePage() {

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [term, setTerm] = useState("First Term");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = (classId: string, t: string) => {
    if (!classId) return;
    setLoading(true);
    authenticatedFetch(`/api/timetable?classId=${classId}&term=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load timetable"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const list: ClassItem[] = Array.isArray(d.data) ? d.data : [];
        setClasses(list);
        if (list[0]) {
          setSelectedClass(list[0].id);
          load(list[0].id, term);
        } else {
          setLoading(false);
        }
      })
      .catch(() => { toast.error("Failed to load classes"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedClass) load(selectedClass, term);
  }, [selectedClass, term]);

  const handleGenerate = async () => {
    if (!selectedClass) return toast.error("Select a class first");
    setGenerating(true);
    try {
      const res = await authenticatedFetch("/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, term }),
      });
      if (!res.ok) throw new Error();
      toast.success("Timetable generated!");
      load(selectedClass, term);
    } catch {
      toast.error("Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  };

  // Group slots by day
  const byDay: Record<string, TimetableSlot[]> = {};
  DAYS.forEach((d) => { byDay[d] = []; });
  slots.forEach((s) => {
    if (byDay[s.day]) byDay[s.day].push(s);
  });

  // All unique time slots for column headers
  const times = Array.from(new Set(slots.map((s) => s.start_time))).sort();

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Timetable</h1>
          <p>View and manage class schedules for each term.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "⚡ Auto-Generate"}
          </button>
          <Link href="/timetable/calendar" className="btn-primary">📅 Calendar View</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="filter-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.section ? ` ${c.section}` : ""}
            </option>
          ))}
        </select>
        <select className="filter-select" value={term} onChange={(e) => setTerm(e.target.value)}>
          {TERMS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid timetable */}
      {loading ? (
        <div className="table-empty">Loading timetable…</div>
      ) : slots.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "5rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🗓️</div>
          <p style={{ fontSize: "1.6rem", fontWeight: 600 }}>No timetable for this class and term.</p>
          <p style={{ fontSize: "1.4rem" }}>Click Auto-Generate to create one automatically.</p>
          <button className="btn-primary" style={{ marginTop: "2rem" }} onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "⚡ Generate Timetable"}
          </button>
        </div>
      ) : times.length > 0 ? (
        <div className="premium-table-card">
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table" style={{ minWidth: `${200 + times.length * 160}px` }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Day</th>
                  {times.map((t) => <th key={t}>{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td style={{ fontWeight: 700, fontSize: "1.4rem", color: "#6A5ACD" }}>{day}</td>
                    {times.map((t) => {
                      const slot = byDay[day].find((s) => s.start_time === t);
                      return (
    <ServiceGate slug="timetable">
                        <td key={t} style={{ minWidth: 140 }}>
                          {slot ? (
                            <div style={{ background: "#f3f0ff", borderRadius: 8, padding: "0.8rem 1rem" }}>
                              <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#3730a3" }}>
                                {slot.subject_name}
                              </div>
                              {slot.teacher_name && (
                                <div style={{ fontSize: "1.1rem", color: "#6A5ACD", marginTop: "0.3rem" }}>
                                  {slot.teacher_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#e2e8f0", fontSize: "1.2rem" }}>—</span>
                          )}
                        </td>
                          </ServiceGate>
  );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
