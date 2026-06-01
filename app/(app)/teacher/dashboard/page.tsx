"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface TeacherClass {
  id: string;
  name: string;
  level?: string;
  section?: string;
  student_count?: number;
}

interface Attendance {
  status: string;
  date: string;
}

interface Lesson {
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

export default function TeacherDashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch("/api/classes", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch("/api/lesson-plans", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch("/api/announcements", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([cd, ld, ad]) => {
        setClasses(Array.isArray(cd.data) ? cd.data : []);
        setLessons(Array.isArray(ld.data) ? ld.data.slice(0, 5) : []);
        setAnnouncements(Array.isArray(ad.data) ? ad.data.slice(0, 4) : []);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const displayName = (user as Record<string, unknown>)?.name as string ?? "Teacher";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Teacher Dashboard</h1>
          <p>Welcome back, {displayName}!</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading…</div>
      ) : (
        <>
          {/* Stats Section */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff" }}>
              <p style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.9rem" }}>My Classes</p>
              <h2 style={{ margin: 0, fontSize: "2.5rem" }}>{classes.length}</h2>
            </div>
            <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff" }}>
              <p style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.9rem" }}>Lesson Plans</p>
              <h2 style={{ margin: 0, fontSize: "2.5rem" }}>{lessons.length}</h2>
            </div>
            <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff" }}>
              <p style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.9rem" }}>Pending Approvals</p>
              <h2 style={{ margin: 0, fontSize: "2.5rem" }}>{lessons.filter((l) => l.status === "pending").length}</h2>
            </div>
          </section>

          {/* My Classes */}
          <section style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 600 }}>My Classes</h3>
            {classes.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ color: "#64748b" }}>No classes assigned yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {classes.map((cls) => (
                  <div key={cls.id} style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff" }}>
                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 600 }}>{cls.name}</h4>
                    <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.9rem" }}>
                      {cls.level && cls.section ? `${cls.level} - ${cls.section}` : "No level"}
                    </p>
                    <p style={{ margin: "0.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>
                      👥 {cls.student_count ?? 0} students
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lesson Plans */}
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 600 }}>Recent Lesson Plans</h3>
              <a href="/lesson-plans" style={{ color: "#6a5acd", textDecoration: "none", fontSize: "0.9rem" }}>
                View all →
              </a>
            </div>
            {lessons.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ color: "#64748b" }}>No lesson plans yet</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Title</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Class</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "1rem", color: "#1e293b" }}>{lesson.title}</td>
                      <td style={{ padding: "1rem", color: "#64748b" }}>{lesson.class_name}</td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            background: lesson.status === "approved" ? "#d1fae5" : "#fef3c7",
                            color: lesson.status === "approved" ? "#065f46" : "#92400e",
                          }}
                        >
                          {lesson.status === "approved" ? "✓ Approved" : "⏳ Pending"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.9rem" }}>
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Announcements */}
          <section>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 600 }}>Latest Announcements</h3>
            {announcements.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ color: "#64748b" }}>No announcements yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {announcements.map((ann) => (
                  <div key={ann.id} style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}>{ann.title}</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </p>
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
