"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { useActiveServices } from "@/lib/hooks/useActiveServices";
import "../../shared.css";

interface TeacherClass {
  id: string;
  name: string;
  level?: string;
  section?: string;
  student_count?: number;
  class_teacher_id?: string;
}

interface LessonPlan {
  id: string;
  title: string;
  class_name: string;
  status: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  created_at: string;
}

interface WorkloadSubject {
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
}

interface TeacherWorkload {
  teacherId: string;
  subjects: WorkloadSubject[];
  subjectCount: number;
}


export default function TeacherDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [workload, setWorkload] = useState<TeacherWorkload>({ teacherId: "", subjects: [], subjectCount: 0 });
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [timetable, setTimetable] = useState<Array<any>>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<{ present: number; absent: number; late: number; excused: number }>({ present: 0, absent: 0, late: 0, excused: 0 });
  const [payrollTotal, setPayrollTotal] = useState<number>(0);
  const [payrollPayments, setPayrollPayments] = useState<Array<{ id: string; amount: number; payment_date: string; payment_method: string }>>([]);
  const [loading, setLoading] = useState(true);
  const { hasService } = useActiveServices();

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      authenticatedFetch(`/api/teachers/${user.id}/workload`)
        .then((r) => r.json())
        .catch(() => ({ data: { teacherId: "", subjects: [], subjectCount: 0 } })),
      authenticatedFetch("/api/classes")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      authenticatedFetch("/api/lesson-plans")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      authenticatedFetch("/api/announcements")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      authenticatedFetch("/api/timetable/my")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      authenticatedFetch("/api/attendance/summary")
        .then((r) => r.json())
        .catch(() => ({ data: { present: 0, absent: 0, late: 0, excused: 0 } })),
    ])
      .then(([wd, cd, ld, ad, td, as]) => {
        setWorkload(wd.data ?? { teacherId: "", subjects: [], subjectCount: 0 });
        const allClasses = Array.isArray(cd.data) ? (cd.data as TeacherClass[]) : [];
        setClasses(allClasses.filter((cls) => cls.class_teacher_id === user.id));
        setLessons(Array.isArray(ld.data) ? ld.data.slice(0, 6) : []);
        setAnnouncements(Array.isArray(ad.data) ? ad.data.slice(0, 4) : []);
        setTimetable(Array.isArray(td?.data) ? td.data : []);
        const summary = as?.data ?? { present: 0, absent: 0, late: 0, excused: 0 };
        setAttendanceSummary({
          present: Number(summary.present ?? 0),
          absent: Number(summary.absent ?? 0),
          late: Number(summary.late ?? 0),
          excused: Number(summary.excused ?? 0),
        });
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // load timetable and attendance summary separately (after user known)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const t = await authenticatedFetch(`/api/timetable/my`);
        const tdata = await t.json();
        setTimetable(Array.isArray(tdata?.data) ? tdata.data : []);
      } catch (e) {
        // ignore
      }

      try {
        const a = await authenticatedFetch(`/api/attendance/summary`);
        const adata = await a.json();
        setAttendanceSummary({
          present: Number(adata?.data?.present ?? 0),
          absent: Number(adata?.data?.absent ?? 0),
          late: Number(adata?.data?.late ?? 0),
          excused: Number(adata?.data?.excused ?? 0),
        });
      } catch (e) {
        // ignore
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    const loadPayroll = async () => {
      if (!user?.id || !hasService("payroll")) return;
      try {
        const res = await authenticatedFetch(`/api/payroll?teacherId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load payroll");
        setPayrollTotal(Number(data.data?.totalPaid ?? 0));
        setPayrollPayments(Array.isArray(data.data?.payments) ? data.data.payments : []);
      } catch {
        toast.error("Unable to load payroll information");
      }
    };

    loadPayroll();
  }, [user?.id, hasService]);

  const displayName = (user as Record<string, unknown>)?.name as string ?? "Teacher";

  const classesBySubject = useMemo(() => {
    return workload.subjects.reduce<Record<string, WorkloadSubject[]>>((acc, item) => {
      acc[item.class_name] = acc[item.class_name] || [];
      acc[item.class_name].push(item);
      return acc;
    }, {});
  }, [workload.subjects]);

  const plannedLessonCount = lessons.length;
  const pendingLessonCount = lessons.filter((lesson) => lesson.status === "pending").length;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Teacher Dashboard</h1>
          <p>Welcome back, {displayName}! Here’s a summary of your teaching load and classroom tools.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading dashboard…</div>
      ) : (
        <>
          <section className="teacher-stats-grid" style={{ marginBottom: "2rem" }}>
            <div className="teacher-overview-card">
              <p>Form classes</p>
              <h2>{classes.length}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Subjects</p>
              <h2>{workload.subjectCount}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Lesson plans</p>
              <h2>{plannedLessonCount}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Attendance (today)</p>
              <h2>
                P:{attendanceSummary.present} • A:{attendanceSummary.absent}
              </h2>
            </div>
          </section>

          {hasService("payroll") && (
            <section className="teacher-stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="teacher-overview-card" style={{ background: "#f8fafc" }}>
                <p>Payroll received</p>
                <h2>₦{payrollTotal.toLocaleString()}</h2>
              </div>
              <div className="teacher-overview-card" style={{ background: "#f8fafc" }}>
                <p>Recent payouts</p>
                <h2>{payrollPayments.length}</h2>
              </div>
            </section>
          )}

          {/* Navigation actions moved to teacher nav (app/(app)/teacher/layout.tsx) */}

          <section className="form-card" style={{ marginBottom: "2rem" }}>
            <h2 className="form-section-title">Active teaching load</h2>
            {timetable.length > 0 && (
              <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Upcoming classes today: {timetable.length}</p>
            )}
            {workload.subjects.length === 0 ? (
              <p>No workload assignments available yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {Object.entries(classesBySubject).map(([className, subjects]) => (
                  <div key={className} style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0 }}>{className}</h3>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>{subjects.length} subject{subjects.length === 1 ? "" : "s"}</span>
                    </div>
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {subjects.map((subject) => (
                        <div key={subject.subject_id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                          <span>{subject.subject_name}</span>
                          <span style={{ color: "#475569", fontSize: "0.95rem" }}>{subject.class_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="form-card" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 className="form-section-title">Recent lesson plans</h2>
              <Link href="/teacher/lesson-plans" className="btn-outline">
                View all
              </Link>
            </div>
            {lessons.length === 0 ? (
              <p>No lesson plans created yet.</p>
            ) : (
              <div className="teacher-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td>{lesson.title}</td>
                        <td>{lesson.class_name}</td>
                        <td>{lesson.status}</td>
                        <td>{new Date(lesson.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="form-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 className="form-section-title">Latest announcements</h2>
              <Link href="/notifications" className="btn-outline">
                All announcements
              </Link>
            </div>
            {announcements.length === 0 ? (
              <p>No announcements published yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {announcements.map((ann) => (
                  <div key={ann.id} style={{ padding: "1.25rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{ann.title}</h3>
                    <p style={{ margin: "0.5rem 0 0", color: "#64748b" }}>{new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
