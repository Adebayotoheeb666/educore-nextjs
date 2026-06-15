"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";

interface Assignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  class_id: string;
  class_name: string;
  academic_session: string;
  term: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Class {
  id: string;
  name: string;
  level: string;
}

export default function SubjectAssignmentsPage() {
  const params = useParams();
  const subjectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [subject, setSubject] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const subjectTeachers = teachers.filter((teacher) => teacher.role === "subject_teacher" || teacher.role === "class_teacher");

  const [formData, setFormData] = useState({
    teacherId: "",
    classId: "",
    term: "",
  });

  useEffect(() => {
    fetchData();
  }, [subjectId, session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subject details
      const subjectRes = await authenticatedFetch(`/api/subjects/${subjectId}`);
      if (subjectRes.ok) {
        const subjectData = await subjectRes.json();
        setSubject(subjectData);
      }

      // Fetch assignments
      const sessionParam = session ? `?session=${session}` : "";
      const assignRes = await authenticatedFetch(`/api/subjects/${subjectId}/teachers${sessionParam}`);
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(Array.isArray(assignData) ? assignData : []);
      }

      // Fetch teachers
      const teachersRes = await authenticatedFetch(`/api/teachers`);
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(Array.isArray(teachersData) ? teachersData : []);
      }

      // Fetch classes
      const classesRes = await authenticatedFetch(`/api/classes`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(Array.isArray(classesData) ? classesData : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teacherId) {
      setError("Please select a teacher");
      return;
    }

    try {
      const res = await authenticatedFetch(`/api/subjects/${subjectId}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: formData.teacherId,
          classId: formData.classId || null,
          academicSession: session,
          term: formData.term || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to assign teacher");
      }

      setFormData({ teacherId: "", classId: "", term: "" });
      setShowAssignForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this assignment?")) return;

    try {
      const res = await authenticatedFetch(`/api/subjects/${subjectId}/teachers?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove assignment");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) return <div className="page-container"><p>Loading assignments...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Teacher Assignments</h1>
          <p className="text-muted">
            {subject?.name} {subject?.code ? `(${subject.code})` : ""}
            {subject?.class_name && ` • Class: ${subject.class_name}`}
          </p>
        </div>
        <Link href={`/subjects/${subjectId}`} className="btn-outline">
          ← Back to Subject
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Academic Session</label>
        <input
          type="text"
          placeholder="e.g., 2024/2025"
          value={session}
          onChange={(e) => setSession(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Assignments ({assignments.length})</h2>
            {subject && (
              <p style={{ margin: "0.5rem 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                <strong>Subject:</strong> {subject.name} {subject.code ? `(${subject.code})` : ""}
                {subject.class_name && ` • ${subject.class_name}`}
              </p>
            )}
          </div>
          <button className="btn-primary" onClick={() => setShowAssignForm(!showAssignForm)}>
            {showAssignForm ? "Cancel" : "➕ Assign Teacher"}
          </button>
        </div>

        {showAssignForm && (
          <form onSubmit={handleAssign} className="assign-form">
            <div className="form-row">
              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                >
                  <option value="">Select a subject teacher</option>
                  {subjectTeachers.length === 0 ? (
                    <option value="" disabled>No subject teachers available</option>
                  ) : (
                    subjectTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Class (Optional)</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">-- Teach in all classes --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Term (Optional)</label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                >
                  <option value="">-- Any term --</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Assign
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Email</th>
                <th>Class</th>
                <th>Session</th>
                <th>Term</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No assignments yet
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="font-bold">{assignment.teacher_name}</td>
                    <td className="text-sm">{assignment.teacher_email}</td>
                    <td>{assignment.class_name || "— (All classes)"}</td>
                    <td className="text-center">{assignment.academic_session}</td>
                    <td className="text-center">{assignment.term || "—"}</td>
                    <td>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .assign-form {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .form-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }
        .form-group {
          flex: 1;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .form-actions {
          display: flex;
          gap: 8px;
        }
        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
        }
        .btn-danger:hover {
          background: #c82333;
        }
        .text-sm {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
