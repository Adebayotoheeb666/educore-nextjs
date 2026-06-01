"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface Subject {
  id: string;
  name: string;
  teacher_name?: string;
  teacher_id?: string;
  class_name?: string;
  academic_session?: string;
}

export default function StudentSubjectsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/students/${user.id}/subjects`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSubjects(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const displayName = (user as Record<string, unknown>)?.name as string ?? "Student";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Subjects</h1>
          <p>Enrolled subjects and their assigned teachers.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading subjects…</div>
      ) : subjects.length === 0 ? (
        <div className="table-empty">No subjects enrolled.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
          {subjects.map((subject) => (
            <div
              key={subject.id}
              style={{
                padding: "2rem",
                background: "white",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem", color: "#1e293b" }}>
                {subject.name}
              </div>
              
              <div style={{ marginBottom: "0.8rem", fontSize: "1.3rem" }}>
                <span style={{ color: "#64748b", marginRight: "0.5rem" }}>👨‍🏫</span>
                <span style={{ fontWeight: 600 }}>Teacher:</span>
                <span style={{ marginLeft: "0.5rem", color: "#6A5ACD", fontWeight: 700 }}>
                  {subject.teacher_name || "TBD"}
                </span>
              </div>

              {subject.class_name && (
                <div style={{ marginBottom: "0.8rem", fontSize: "1.3rem" }}>
                  <span style={{ color: "#64748b", marginRight: "0.5rem" }}>🏫</span>
                  <span style={{ fontWeight: 600 }}>Class:</span>
                  <span style={{ marginLeft: "0.5rem", color: "#475569" }}>
                    {subject.class_name}
                  </span>
                </div>
              )}

              {subject.academic_session && (
                <div style={{ fontSize: "1.3rem" }}>
                  <span style={{ color: "#64748b", marginRight: "0.5rem" }}>📅</span>
                  <span style={{ fontWeight: 600 }}>Session:</span>
                  <span style={{ marginLeft: "0.5rem", color: "#475569" }}>
                    {subject.academic_session}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
