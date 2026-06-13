"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";
import TimePicker from "@/components/TimePicker";

interface TimetableSlot {
  id: string;
  class_id?: string;
  class_name?: string;
  class_section?: string;
  subject_id?: string;
  subject_name?: string;
  teacher_id?: string;
  teacher_name?: string;
  day: string;
  start_time: string;
  end_time?: string;
  term: string;
}

interface ClassItem { id: string; name: string; section?: string; }
interface SubjectItem { id: string; name: string; class_id?: string | null; }
interface TeacherItem { id: string; name: string; }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TERMS = ["First Term", "Second Term", "Third Term"];
const TIMES_12 = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];
function to24hr(value12?: string) {
  if (!value12) return "";
  const m = value12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return value12;
  let h = Number(m[1]);
  const mm = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${mm}`;
}
function to12hr(value24?: string) {
  if (!value24) return "";
  const m = value24.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return value24;
  let h = Number(m[1]);
  const mm = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${mm} ${ampm}`;
}

function isValid12hr(v?: string) {
  if (!v) return false;
  return /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i.test(v.trim());
}
const PAGE_SIZE = 8;

const initialForm = {
  id: "",
  classId: "",
  subjectId: "",
  teacherId: "",
  day: "Monday",
  startTime: "8:00 AM",
  endTime: "9:00 AM",
  term: "First Term",
};

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [term, setTerm] = useState("First Term");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [page, setPage] = useState(1);

  const resetForm = (override: Partial<typeof initialForm> = {}) => {
    setForm({ ...initialForm, classId: selectedClass || "", term, ...override });
  };

  const openNewSlotForm = () => {
    resetForm();
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const loadSlots = (classId: string, selectedTerm: string) => {
    if (!classId) return;
    setLoading(true);
    authenticatedFetch(`/api/timetable?classId=${classId}&term=${encodeURIComponent(selectedTerm)}`)
      .then((res) => res.json())
      .then((data) => {
        const list: TimetableSlot[] = Array.isArray(data.data) ? data.data : [];
        // convert times to 12hr for UI
        const converted = list.map((s) => ({ ...s, start_time: to12hr(s.start_time), end_time: s.end_time ? to12hr(s.end_time) : s.end_time }));
        setSlots(converted);
      })
      .catch(() => toast.error("Failed to load timetable"))
      .finally(() => setLoading(false));
  };

  const loadHelpers = async () => {
    try {
      const [subjectsRes, teachersRes] = await Promise.all([
        authenticatedFetch("/api/subjects"),
        authenticatedFetch("/api/teachers"),
      ]);
      const [subjectData, teacherData] = await Promise.all([subjectsRes.json(), teachersRes.json()]);
      setSubjects(Array.isArray(subjectData.data) ? subjectData.data : []);
      setTeachers(Array.isArray(teacherData.data) ? teacherData.data : []);
    } catch {
      toast.error("Failed to load timetable helpers");
    }
  };

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        const list: ClassItem[] = Array.isArray(data.data) ? data.data : [];
        setClasses(list);
        if (list[0]) {
          setSelectedClass(list[0].id);
          loadSlots(list[0].id, term);
        } else {
          setLoading(false);
        }
      })
      .catch(() => { toast.error("Failed to load classes"); setLoading(false); });

    loadHelpers();
  }, []);

  useEffect(() => {
    if (selectedClass) loadSlots(selectedClass, term);
  }, [selectedClass, term]);

  useEffect(() => {
    if (!form.id && selectedClass) {
      setForm((prev) => ({ ...prev, classId: selectedClass }));
    }
  }, [selectedClass, form.id]);

  useEffect(() => {
    setPage(1);
  }, [selectedClass, term]);

  const availableSubjects = useMemo(
    () => subjects.filter((subject) => !subject.class_id || subject.class_id === selectedClass),
    [subjects, selectedClass]
  );

  const nextTime = (time12: string) => {
    const as24 = to24hr(time12);
    const m = as24.match(/^(\d{2}):(\d{2})/);
    if (!m) return "";
    const nextHour = (Number(m[1]) + 1) % 24;
    const next24 = `${String(nextHour).padStart(2, "0")}:${m[2]}`;
    return to12hr(next24);
  };

  const handleGenerate = async () => {
    if (!selectedClass) return toast.error("Select a class first");
    setGenerating(true);
    try {
      const res = await authenticatedFetch("/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, term }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to generate timetable");
      toast.success(data?.message || "Timetable generated!");
      setShowForm(false);
      loadSlots(selectedClass, term);
    } catch {
      toast.error("Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!form.classId) return toast.error("Select a class first");
    if (!form.subjectId) return toast.error("Pick a subject");
    if (!form.day) return toast.error("Pick a day");
    if (!form.startTime || !isValid12hr(form.startTime)) return toast.error("Enter a valid start time (e.g. 8:30 AM)");
    if (!form.endTime || !isValid12hr(form.endTime)) return toast.error("Enter a valid end time (e.g. 9:15 AM)");

    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const payload = {
        ...form,
        startTime: to24hr(form.startTime),
        endTime: to24hr(form.endTime),
      };
      const res = await authenticatedFetch("/api/timetable", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to save slot");
      toast.success(form.id ? "Slot updated" : "Slot added");
      resetForm();
      setShowForm(false);
      loadSlots(selectedClass, term);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save timetable slot");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSlot = (slot: TimetableSlot) => {
    setForm({
      id: slot.id,
      classId: slot.class_id || selectedClass,
      subjectId: slot.subject_id || "",
      teacherId: slot.teacher_id || "",
      day: slot.day,
      startTime: slot.start_time || initialForm.startTime,
      endTime: slot.end_time || nextTime(slot.start_time || initialForm.startTime),
      term: slot.term,
    });
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this timetable slot?")) return;
    setDeletingId(slotId);
    try {
      const res = await authenticatedFetch("/api/timetable", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slotId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to delete slot");
      toast.success("Slot removed");
      loadSlots(selectedClass, term);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete timetable slot");
    } finally {
      setDeletingId("");
    }
  };

  // Group slots by day
  const byDay: Record<string, TimetableSlot[]> = {};
  DAYS.forEach((d) => { byDay[d] = []; });
  slots.forEach((s) => {
    if (byDay[s.day]) byDay[s.day].push(s);
  });

  const times = Array.from(new Set(slots.map((s) => s.start_time))).sort((a, b) => {
    return to24hr(a).localeCompare(to24hr(b));
  });
  const totalPages = Math.max(1, Math.ceil(slots.length / PAGE_SIZE));
  const paginatedSlots = slots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = slots.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, slots.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <ServiceGate slug="timetable">
      <div>
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>Timetable</h1>
            <p>View and manage class schedules for each term.</p>
          </div>
          <div className="header-actions">
          <button type="button" className="btn-outline" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "⚡ Auto-Generate"}
          </button>
          <button type="button" className="btn-primary" onClick={openNewSlotForm}>
            + Add Slot
          </button>
          <Link href="/timetable/calendar" className="btn-primary">📅 Calendar View</Link>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.section ? ` ${c.section}` : ""}
            </option>
          ))}
        </select>
        <select className="filter-select" value={term} onChange={(e) => setTerm(e.target.value)}>
          {TERMS.map((termOption) => <option key={termOption}>{termOption}</option>)}
        </select>
      </div>

      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <div className="premium-table-card" style={{ width: "min(920px, 96%)", margin: 0, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? "Edit Timetable Slot" : "Create Timetable Slot"}</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>Add or update a class schedule entry.</p>
              </div>
              <button type="button" className="btn-outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <label>
              Subject
              <select className="filter-select" value={form.subjectId} onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}>
                <option value="">Select subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label>
              Teacher
              <select className="filter-select" value={form.teacherId} onChange={(e) => setForm((prev) => ({ ...prev, teacherId: e.target.value }))}>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </label>
            <label>
              Day
              <select className="filter-select" value={form.day} onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}>
                {DAYS.map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
            <label>
              Start time
              <TimePicker value={form.startTime} onChange={(v) => setForm((prev) => ({ ...prev, startTime: v, endTime: nextTime(v) }))} id="start-time" />
              {!isValid12hr(form.startTime) && (
                <div style={{ color: "#dc2626", marginTop: 6, fontSize: "0.95rem" }}>Enter time like 8:30 AM</div>
              )}
            </label>
            <label>
              End time
              <TimePicker value={form.endTime} onChange={(v) => setForm((prev) => ({ ...prev, endTime: v }))} id="end-time" />
              {!isValid12hr(form.endTime) && (
                <div style={{ color: "#dc2626", marginTop: 6, fontSize: "0.95rem" }}>Enter time like 9:15 AM</div>
              )}
            </label>
            <label>
              Term
              <select className="filter-select" value={form.term} onChange={(e) => setForm((prev) => ({ ...prev, term: e.target.value }))}>
                {TERMS.map((termOption) => <option key={termOption}>{termOption}</option>)}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={handleSaveSlot} disabled={saving}>
              {saving ? "Saving…" : form.id ? "Update Slot" : "Create Slot"}
            </button>
            <button type="button" className="btn-outline" onClick={() => { resetForm(); }}>
              Reset
            </button>
          </div>
        </div>
        </div>
      )}

      {loading ? (
        <div className="table-empty">Loading timetable…</div>
      ) : (
        <>
          <div className="premium-table-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0 }}>Class timetable</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>View scheduled lessons by day and start time.</p>
              </div>
            </div>
            {slots.length === 0 ? (
              <div style={{ padding: 24, color: "#64748b" }}>
                No timetable rows found for this class and term.
              </div>
            ) : (
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
                            <td key={`${day}-${t}`} style={{ minWidth: 140 }}>
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
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="premium-table-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Manage timetable slots</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>Edit or remove individual schedule entries.</p>
              </div>
              <button type="button" className="btn-primary" onClick={openNewSlotForm}>
                + New slot
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="premium-table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Term</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, color: "#64748b" }}>
                        No slots available yet for this class and term.
                      </td>
                    </tr>
                  ) : (
                    paginatedSlots.map((slot) => (
                      <tr key={slot.id}>
                        <td>{slot.day}</td>
                        <td>{slot.start_time}</td>
                        <td>{slot.end_time || "—"}</td>
                        <td>{slot.subject_name || "—"}</td>
                        <td>{slot.teacher_name || "—"}</td>
                        <td>{slot.term}</td>
                        <td>
                          <button type="button" className="btn-outline" style={{ marginRight: 8 }} onClick={() => handleEditSlot(slot)}>
                            Edit
                          </button>
                          <button type="button" className="btn-outline" disabled={deletingId === slot.id} onClick={() => handleDeleteSlot(slot.id)}>
                            {deletingId === slot.id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {slots.length > PAGE_SIZE && (
              <div className="table-pagination">
                <span>
                  Showing {showingFrom}–{showingTo} of {slots.length} slots
                </span>
                <div className="pag-buttons">
                  <button type="button" className="pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`pag-btn ${pageNumber === page ? "active" : ""}`}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" className="pag-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </ServiceGate>
  );
}
