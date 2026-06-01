"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface TeacherClass {
  id: string;
  name: string;
  level?: string;
  section?: string;
  class_teacher_id?: string;
  student_count?: number;
}

interface WorkloadSubject {
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
}

export default function TeacherClassesPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [workload, setWorkload] = useState<WorkloadSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      fetch("/api/classes", { credentials: "include" }).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/teachers/${user.id}/workload`, { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ data: { subjects: [] } })),
    ])
      .then(([classData, workloadData]) => {
        const allClasses = Array.isArray(classData.data) ? classData.data : [];
        setClasses(allClasses.filter((c) => c.class_teacher_id === user.id));

        const subjects = Array.isArray(workloadData.data?.subjects)
          ? workloadData.data.subjects
          : [];
        setWorkload(subjects);
      })
      .catch(() => toast.error("Failed to load teacher classes."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const teachingClasses = useMemo(
    () => Array.from(new Map(workload.map((item) => [item.class_id, item.class_name])).values()),
    [workload]
  );

  const subjectGroups = useMemo(() => {
    return workload.reduce<Record<string, WorkloadSubject[]>>((acc, item) => {
      acc[item.class_name] = acc[item.class_name] || [];
      acc[item.class_name].push(item);
      return acc;
    }, {});
  }, [workload]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Classes</h1>
          <p>View the classes you oversee as form teacher and the subjects you teach across the school.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading classes…</div>
      ) : (
        <>
          <div className="teacher-stats-grid" style={{ marginBottom: "2rem" }}>
            <div className="teacher-overview-card">
              <p>Form classes</p>
              <h2>{classes.length}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Class groups taught</p>
              <h2>{teachingClasses.length}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Subjects assigned</p>
              <h2>{workload.length}</h2>
            </div>
            <div className="teacher-overview-card">
              <p>Student roster size</p>
              <h2>{classes.reduce((sum, cls) => sum + (cls.student_count ?? 0), 0)}</h2>
            </div>
          </div>

          <section className="form-card" style={{ marginBottom: "2rem" }}>
            <h2 className="form-section-title">Form Classes</h2>
            {classes.length === 0 ? (
              <p>No form classes assigned yet.</p>
            ) : (
              <div className="teacher-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>{cls.name}</td>
                        <td>{cls.section ?? "—"}</td>
                        <td>{cls.student_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="form-card">
            <h2 className="form-section-title">Subject Load</h2>
            {workload.length === 0 ? (
              <p>No subject assignments found.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {Object.entries(subjectGroups).map(([className, subjects]) => (
                  <div key={className} style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0 }}>{className}</h3>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>{subjects.length} subject{subjects.length === 1 ? "" : "s"}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.3rem", color: "#475569" }}>
                      {subjects.map((subject) => (
                        <li key={subject.subject_id}>{subject.subject_name}</li>
                      ))}
                    </ul>
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
