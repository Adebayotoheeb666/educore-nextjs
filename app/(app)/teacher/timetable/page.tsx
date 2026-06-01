"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface TimetableSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  class_name: string;
  section?: string;
  subject_name: string;
  teacher_name?: string;
}

interface WorkloadSubject {
  class_id: string;
}

export default function TeacherTimetablePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    fetch(`/api/teachers/${user.id}/workload`, { credentials: "include" })
      .then((r) => r.json())
      .then(async (data) => {
        const subjects = Array.isArray(data.data?.subjects) ? data.data.subjects : [];
        const classIds = Array.from(
          new Set(subjects.map((item: WorkloadSubject) => item.class_id).filter(Boolean))
        );

        if (!classIds.length) {
          setSlots([]);
          return;
        }

        const timetablePromises = classIds.map((classId) =>
          fetch(`/api/timetable?classId=${encodeURIComponent(classId)}`, { credentials: "include" })
            .then((r) => r.json())
            .then((classData) => (Array.isArray(classData.data) ? classData.data : []))
            .catch(() => [])
        );

        const timetablePages = await Promise.all(timetablePromises);
        const allSlots = timetablePages.flat() as TimetableSlot[];
        allSlots.sort((a, b) => a.day.localeCompare(b.day) || a.start_time.localeCompare(b.start_time));
        setSlots(allSlots);
      })
      .catch(() => toast.error("Failed to load timetable."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Timetable</h1>
          <p>See your teaching schedule for all assigned classes and subjects.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading timetable…</div>
      ) : slots.length === 0 ? (
        <div className="table-empty">No timetable entries found for your teaching assignments yet.</div>
      ) : (
        <div className="teacher-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Class</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.day}</td>
                  <td>
                    {slot.start_time} - {slot.end_time}
                  </td>
                  <td>{slot.class_name}</td>
                  <td>{slot.subject_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
