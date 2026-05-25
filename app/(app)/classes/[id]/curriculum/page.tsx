"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Subject {
  id: string;
  sequence: number;
  subject_id: string;
  name: string;
  code: string;
  is_compulsory: number;
  teacher_ids: string;
  teacher_names: string;
  teacher_count: number;
  assignment_ids: string;
}

interface StudentInSubject {
  id: string;
  student_id: string;
  name: string;
  admission_no: string;
  email: string;
  status: string;
  enrolled_date: string;
}

interface AllSubject {
  id: string;
  name: string;
  code: string;
}

export default function ClassCurriculumPage() {
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<AllSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [studentsInSubject, setStudentsInSubject] = useState<Record<string, StudentInSubject[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCurriculumData();
  }, [classId, session]);

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  const fetchCurriculumData = async () => {
    try {
      setLoading(true);
      const sessionParam = session ? `?session=${session}` : "";
      const res = await fetch(`/api/classes/${classId}/subjects${sessionParam}`);

      if (!res.ok) throw new Error("Failed to fetch curriculum");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const res = await fetch(`/api/subjects`);
      if (res.ok) {
        const data = await res.json();
        // Handle both direct array and wrapped response
        const subjectsArray = Array.isArray(data) ? data : (data?.data ? data.data : []);
        setAllSubjects(subjectsArray);
      } else {
        console.error("Failed to fetch subjects:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError("Failed to load available subjects");
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject");
      return;
    }

    try {
      const res = await fetch(`/api/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          isCompulsory: true,
          sequence: (subjects.length || 0) + 1,
          academicSession: session,
        }),
      });

      if (!res.ok) throw new Error("Failed to add subject");
      setSelectedSubjectId("");
      setShowAddSubject(false);
      fetchCurriculumData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!confirm("Remove this subject from the curriculum?")) return;

    try {
      const sessionParam = session ? `?session=${session}` : "";
      const res = await fetch(`/api/classes/${classId}/subjects/${subjectId}${sessionParam}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove subject");
      fetchCurriculumData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const toggleExpandSubject = async (subjectId: string) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      // Fetch students for this subject if not already loaded
      if (!studentsInSubject[subjectId]) {
        await fetchStudentsInSubject(subjectId);
      }
    }
  };

  const fetchStudentsInSubject = async (subjectId: string) => {
    try {
      setLoadingStudents((prev) => ({ ...prev, [subjectId]: true }));
      const sessionParam = session ? `?session=${session}` : "";
      const res = await fetch(
        `/api/classes/${classId}/subjects/${subjectId}/students${sessionParam}`
      );

      if (res.ok) {
        const data = await res.json();
        setStudentsInSubject((prev) => ({ ...prev, [subjectId]: data }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoadingStudents((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const handleRemoveStudentFromSubject = async (subjectId: string, studentId: string) => {
    if (!confirm("Remove this student from this subject?")) return;

    try {
      const sessionParam = session ? `?session=${session}` : "";
      const res = await fetch(
        `/api/classes/${classId}/subjects/${subjectId}/students/${studentId}${sessionParam}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove student");
      // Refresh students list
      await fetchStudentsInSubject(subjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getAddedSubjects = new Set(subjects.map((s) => s.subject_id));
  const availableSubjects = allSubjects.filter((s) => !getAddedSubjects.has(s.id));

  if (loading) return <div className="page-container"><p>Loading curriculum...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Class Curriculum</h1>
          <p className="text-muted">Manage subjects and teachers for this class</p>
        </div>
        <Link href={`/classes/${classId}`} className="btn-outline">
          ← Back to Class
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
          <h2>Subjects ({subjects.length})</h2>
          <button className="btn-primary" onClick={() => setShowAddSubject(!showAddSubject)}>
            {showAddSubject ? "Cancel" : "➕ Add Subject"}
          </button>
        </div>

        {showAddSubject && (
          <div className="add-subject-form">
            {availableSubjects.length === 0 ? (
              <p className="text-muted">
                {allSubjects.length === 0
                  ? "No subjects available. Please create subjects first."
                  : "All available subjects have been added to this class."}
              </p>
            ) : (
              <div className="form-row">
                <div className="form-group">
                  <label>Subject ({availableSubjects.length} available)</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button className="btn-primary" onClick={handleAddSubject}>
                    Add to Curriculum
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Seq</th>
                <th>Subject</th>
                <th>Code</th>
                <th>Required</th>
                <th>Teachers Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No subjects in curriculum
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="text-center">{subject.sequence}</td>
                    <td className="font-bold">
                      <Link href={`/subjects/${subject.subject_id}`} className="link">
                        {subject.name}
                      </Link>
                    </td>
                    <td>{subject.code || "—"}</td>
                    <td className="text-center">
                      {subject.is_compulsory ? (
                        <span className="badge badge-required">Required</span>
                      ) : (
                        <span className="badge badge-elective">Elective</span>
                      )}
                    </td>
                    <td>
                      {subject.teacher_count > 0 ? (
                        <span className="teacher-list">
                          {subject.teacher_names}
                          <br />
                          <small className="text-muted">({subject.teacher_count} teacher{subject.teacher_count !== 1 ? "s" : ""})</small>
                        </span>
                      ) : (
                        <span className="text-warning">⚠️ No teachers assigned</span>
                      )}
                    </td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => toggleExpandSubject(subject.subject_id)}
                      >
                        {expandedSubject === subject.subject_id ? "Hide Students" : "View Students"}
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleRemoveSubject(subject.subject_id)}
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

        {/* Students in subject section */}
        {expandedSubject && (
          <div className="students-section">
            <h3 style={{ marginTop: "24px", marginBottom: "16px" }}>
              Students taking {subjects.find((s) => s.subject_id === expandedSubject)?.name}
            </h3>

            {loadingStudents[expandedSubject] ? (
              <p className="text-muted">Loading students...</p>
            ) : studentsInSubject[expandedSubject]?.length === 0 ? (
              <p className="text-muted">No students enrolled in this subject</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Admission No.</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentsInSubject[expandedSubject] || []).map((student) => (
                      <tr key={student.id}>
                        <td className="font-bold">{student.name}</td>
                        <td>{student.admission_no || "—"}</td>
                        <td>{student.email}</td>
                        <td>
                          <span className="badge badge-active">{student.status}</span>
                        </td>
                        <td>
                          <button
                            className="btn-small btn-danger"
                            onClick={() => handleRemoveStudentFromSubject(expandedSubject, student.student_id)}
                          >
                            Remove from Subject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .add-subject-form {
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
        .form-actions {
          display: flex;
          gap: 8px;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-required {
          background: #d4edda;
          color: #155724;
        }
        .badge-elective {
          background: #cfe2ff;
          color: #084298;
        }
        .badge-active {
          background: #cfe2ff;
          color: #084298;
        }
        .teacher-list {
          display: block;
          line-height: 1.4;
        }
        .text-warning {
          color: #ff9800;
        }
        .text-muted {
          color: #6b7280;
        }
        .link {
          color: #667eea;
          text-decoration: none;
          cursor: pointer;
        }
        .link:hover {
          text-decoration: underline;
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
        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
        }
        .btn-secondary:hover {
          background: #5a6268;
        }
        .font-bold {
          font-weight: 700;
        }
        .text-center {
          text-align: center;
        }
        .students-section {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
          margin-top: 16px;
          border-left: 4px solid #667eea;
        }
      `}</style>
    </div>
  );
}
