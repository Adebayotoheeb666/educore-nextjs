"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";

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

interface ClassStudent {
  id: string;
  name: string;
  admission_no: string;
  email: string;
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
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [showOptionalAssignment, setShowOptionalAssignment] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, Set<string>>>({});
  const [assigningOptional, setAssigningOptional] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCurriculumData();
  }, [classId, session]);

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  const fetchCurriculumData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(`/api/classes/${classId}/subjects${sessionParam}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch curriculum (${res.status})`);
      }
      const data = await res.json();
      const subjectsArray = Array.isArray(data) ? data : (data?.data || []);
      setSubjects(subjectsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const res = await authenticatedFetch(`/api/subjects`);
      if (res.ok) {
        const data = await res.json();
        const subjectsArray = Array.isArray(data) ? data : (data?.data || []);
        setAllSubjects(subjectsArray);
      } else {
        console.error("Failed to fetch subjects:", res.status);
        setError(`Failed to load subjects (${res.status})`);
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
      const res = await authenticatedFetch(`/api/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          isCompulsory: false,
          sequence: (subjects.length || 0) + 1,
          academicSession: session,
        }),
      });

      if (!res.ok) throw new Error("Failed to add subject");
      setSelectedSubjectId("");
      setShowAddSubject(false);
      setError(null);
      fetchCurriculumData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!confirm("Remove this subject from the curriculum?")) return;

    try {
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(`/api/classes/${classId}/subjects/${subjectId}${sessionParam}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove subject");
      setError(null);
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
      if (!studentsInSubject[subjectId]) {
        await fetchStudentsInSubject(subjectId);
      }
    }
  };

  const fetchStudentsInSubject = async (subjectId: string) => {
    try {
      setLoadingStudents((prev) => ({ ...prev, [subjectId]: true }));
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(
        `/api/classes/${classId}/subjects/${subjectId}/students${sessionParam}`
      );

      if (res.ok) {
        const data = await res.json();
        const studentsList = Array.isArray(data) ? data : (data?.data || []);
        setStudentsInSubject((prev) => ({ ...prev, [subjectId]: studentsList }));
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
      const res = await authenticatedFetch(
        `/api/classes/${classId}/subjects/${subjectId}/students/${studentId}${sessionParam}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove student");
      await fetchStudentsInSubject(subjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const fetchClassStudents = async () => {
    try {
      setLoadingClassStudents(true);
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(`/api/classes/${classId}/students${sessionParam}`);

      if (res.ok) {
        const data = await res.json();
        const studentsList = Array.isArray(data) ? data : (data?.data || []);
        setClassStudents(studentsList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch class students");
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const handleOptionalSubjectAssignment = async (subjectId: string) => {
    if (!selectedStudentIds[subjectId] || selectedStudentIds[subjectId].size === 0) {
      setError("Please select at least one student");
      return;
    }

    try {
      setAssigningOptional((prev) => ({ ...prev, [subjectId]: true }));
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(
        `/api/classes/${classId}/subjects/${subjectId}/students${sessionParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentIds: Array.from(selectedStudentIds[subjectId]),
            academicSession: session || undefined,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to assign students to subject");
      setSelectedStudentIds((prev) => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
      setShowOptionalAssignment(null);
      await fetchStudentsInSubject(subjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAssigningOptional((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const toggleStudentSelection = (subjectId: string, studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev[subjectId] || []);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return { ...prev, [subjectId]: newSet };
    });
  };

  const getAddedSubjects = new Set(subjects.map((s) => s.subject_id));
  const availableSubjects = allSubjects.filter((s) => !getAddedSubjects.has(s.id));
  const getEnrolledStudentIds = (subjectId: string) => new Set((studentsInSubject[subjectId] || []).map((s) => s.student_id));
  const getAvailableStudentsForSubject = (subjectId: string) => {
    const enrolledIds = getEnrolledStudentIds(subjectId);
    return classStudents.filter((s) => !enrolledIds.has(s.id));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "1.4rem", color: "#64748b" }}>Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Class Curriculum & Subjects</h1>
          <p>Manage subjects, teachers, and student enrollments</p>
        </div>
        <Link href={`/classes/${classId}`} className="btn-outline">
          ← Back to Class
        </Link>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem" }}>
            ✕
          </button>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <label style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", display: "block" }}>Academic Session</label>
        <input
          type="text"
          placeholder="e.g., 2024/2025"
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="curriculum-input"
        />
      </div>

      <div className="premium-table-card">
        <div style={{ padding: "2rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>
            Curriculum Subjects ({subjects.length})
          </h2>
          <button
            className="btn-primary"
            onClick={() => {
              setShowAddSubject(!showAddSubject);
              setSelectedSubjectId("");
            }}
          >
            {showAddSubject ? "Cancel" : "📚 Add Subject"}
          </button>
        </div>

        {showAddSubject && (
          <div className="add-subject-form-section">
            {error && error.includes("Failed to load") ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                <p style={{ fontSize: "1.3rem", margin: 0 }}>⚠️ {error}</p>
              </div>
            ) : allSubjects.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>
                  {subjects.length === 0 ? "Loading subjects..." : "No subjects available. Please create subjects first."}
                </p>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>All available subjects ({allSubjects.length}) have been added to this class.</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", display: "block" }}>
                    Select Subject ({availableSubjects.length} available)
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="curriculum-select"
                  >
                    <option value="">Choose a subject...</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn-primary" onClick={handleAddSubject}>
                  Add Subject
                </button>
              </div>
            )}
          </div>
        )}

        <div className="table-responsive" style={{ padding: "2rem" }}>
          {subjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              <p style={{ fontSize: "1.3rem" }}>No subjects in curriculum yet</p>
              <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>Click "Add Subject" to start building your curriculum</p>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Seq</th>
                  <th>Subject Name</th>
                  <th style={{ width: "100px" }}>Code</th>
                  <th style={{ width: "100px" }}>Type</th>
                  <th>Teachers</th>
                  <th style={{ width: "200px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#667eea" }}>{subject.sequence}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      {subject.subject_id ? (
                        <Link href={`/subjects/${subject.subject_id}`} className="subject-link">
                          {subject.name}
                        </Link>
                      ) : (
                        <span>{subject.name}</span>
                      )}
                    </td>
                    <td><span className="mono">{subject.code || "—"}</span></td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`subject-badge ${subject.is_compulsory ? "badge-required" : "badge-elective"}`}>
                        {subject.is_compulsory ? "Required" : "Elective"}
                      </span>
                    </td>
                    <td>
                      {subject.teacher_count > 0 ? (
                        <div className="teacher-info">
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{subject.teacher_names}</span>
                          <span style={{ fontSize: "1.1rem", color: "#64748b", display: "block" }}>
                            ({subject.teacher_count} {subject.teacher_count === 1 ? "teacher" : "teachers"})
                          </span>
                        </div>
                      ) : (
                        <span className="no-teachers-alert">⚠️ No teachers assigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
                        <Link
                          href={`/subjects/${subject.subject_id}`}
                          className="btn-action btn-manage"
                          title="Manage teachers for this subject"
                        >
                          👨‍🏫 Teachers
                        </Link>
                        <button
                          className="btn-action btn-view"
                          onClick={() => toggleExpandSubject(subject.subject_id)}
                          title={expandedSubject === subject.subject_id ? "Hide students" : "View students"}
                        >
                          {expandedSubject === subject.subject_id ? "▼ Hide" : "▶ View"} Students
                        </button>
                        {!subject.is_compulsory && (
                          <button
                            className="btn-action btn-assign"
                            onClick={() => {
                              setShowOptionalAssignment(subject.subject_id);
                              if (classStudents.length === 0) {
                                fetchClassStudents();
                              }
                            }}
                            title="Assign students to optional subject"
                          >
                            + Assign Students
                          </button>
                        )}
                        <button
                          className="btn-action btn-remove"
                          onClick={() => handleRemoveSubject(subject.subject_id)}
                          title="Remove subject"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {expandedSubject && (
          <div className="subject-enrollment-panel">
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
              📋 Students Enrolled in {subjects.find((s) => s.subject_id === expandedSubject)?.name}
            </h3>

            {loadingStudents[expandedSubject] ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>Loading students...</p>
              </div>
            ) : !studentsInSubject[expandedSubject] || studentsInSubject[expandedSubject].length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>No students enrolled in this subject</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th style={{ width: "120px" }}>Admission No.</th>
                      <th>Email</th>
                      <th style={{ width: "100px" }}>Status</th>
                      <th style={{ width: "150px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentsInSubject[expandedSubject] || []).map((student) => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{student.name}</td>
                        <td><span className="mono">{student.admission_no || "—"}</span></td>
                        <td>{student.email}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="status-badge badge-active">{student.status}</span>
                        </td>
                        <td>
                          <button
                            className="btn-action btn-remove-student"
                            onClick={() => handleRemoveStudentFromSubject(expandedSubject, student.student_id)}
                          >
                            Remove
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

        {showOptionalAssignment && (
          <div className="optional-assignment-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
                Assign Students to {subjects.find((s) => s.subject_id === showOptionalAssignment)?.name} (Optional)
              </h3>
              <button
                onClick={() => {
                  setShowOptionalAssignment(null);
                  setSelectedStudentIds((prev) => {
                    const updated = { ...prev };
                    delete updated[showOptionalAssignment];
                    return updated;
                  });
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.6rem",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            {loadingClassStudents ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>Loading students...</p>
              </div>
            ) : getAvailableStudentsForSubject(showOptionalAssignment).length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>All students in the class are already assigned to this subject</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th style={{ width: "40px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={
                              getAvailableStudentsForSubject(showOptionalAssignment).length > 0 &&
                              getAvailableStudentsForSubject(showOptionalAssignment).every((s) =>
                                (selectedStudentIds[showOptionalAssignment] || new Set()).has(s.id)
                              )
                            }
                            onChange={(e) => {
                              setSelectedStudentIds((prev) => {
                                const newSet = new Set(
                                  e.target.checked
                                    ? getAvailableStudentsForSubject(showOptionalAssignment).map((s) => s.id)
                                    : []
                                );
                                return { ...prev, [showOptionalAssignment]: newSet };
                              });
                            }}
                            style={{ cursor: "pointer", width: "18px", height: "18px" }}
                          />
                        </th>
                        <th>Student Name</th>
                        <th style={{ width: "120px" }}>Admission No.</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAvailableStudentsForSubject(showOptionalAssignment).map((student) => (
                        <tr key={student.id}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={(selectedStudentIds[showOptionalAssignment] || new Set()).has(student.id)}
                              onChange={() => toggleStudentSelection(showOptionalAssignment, student.id)}
                              style={{ cursor: "pointer", width: "18px", height: "18px" }}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{student.name}</td>
                          <td><span className="mono">{student.admission_no || "—"}</span></td>
                          <td>{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setShowOptionalAssignment(null);
                      setSelectedStudentIds((prev) => {
                        const updated = { ...prev };
                        delete updated[showOptionalAssignment];
                        return updated;
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleOptionalSubjectAssignment(showOptionalAssignment)}
                    disabled={assigningOptional[showOptionalAssignment] || (selectedStudentIds[showOptionalAssignment] || new Set()).size === 0}
                  >
                    {assigningOptional[showOptionalAssignment]
                      ? "Assigning..."
                      : `Assign ${(selectedStudentIds[showOptionalAssignment] || new Set()).size} Student${(selectedStudentIds[showOptionalAssignment] || new Set()).size !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .curriculum-input {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1.3rem;
          background: var(--bg-card);
          color: var(--text-main);
          outline: none;
          transition: all 0.15s;
        }

        .curriculum-input:focus {
          border-color: #6A5ACD;
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .curriculum-select {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1.3rem;
          background: var(--bg-card);
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .curriculum-select:focus {
          border-color: #6A5ACD;
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .add-subject-form-section {
          padding: 2rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .subject-link {
          color: #6A5ACD;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.15s;
        }

        .subject-link:hover {
          text-decoration: underline;
        }

        .subject-badge {
          padding: 0.4rem 1rem;
          border-radius: 6px;
          font-size: 1.1rem;
          font-weight: 700;
          display: inline-block;
        }

        .badge-required {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge-elective {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge {
          padding: 0.4rem 1rem;
          border-radius: 6px;
          font-size: 1.1rem;
          font-weight: 700;
          display: inline-block;
        }

        .badge-active {
          background: #d1fae5;
          color: #065f46;
        }

        .teacher-info {
          line-height: 1.5;
        }

        .no-teachers-alert {
          color: #ea580c;
          font-weight: 600;
        }

        .btn-action {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .btn-view {
          background: #f0f4ff;
          color: #4f46e5;
          border: 1px solid #ddd6fe;
        }

        .btn-view:hover {
          background: #e0e7ff;
          border-color: #c7d2fe;
        }

        .btn-manage {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          text-decoration: none;
          display: inline-block;
        }

        .btn-manage:hover {
          background: #fcd34d;
          border-color: #fbbf24;
        }

        .btn-assign {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .btn-assign:hover {
          background: #dcfce7;
          border-color: #86efac;
        }

        .btn-remove {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .btn-remove:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .btn-remove-student {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .btn-remove-student:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .subject-enrollment-panel {
          padding: 2rem;
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
          margin-top: 0;
          border-radius: 0 0 16px 16px;
        }

        .optional-assignment-panel {
          padding: 2rem;
          background: #f0fdf4;
          border-top: 2px solid #86efac;
          margin-top: 0;
          border-radius: 0 0 16px 16px;
        }

        .alert-banner {
          padding: 1.2rem 1.5rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 1.2rem;
          }

          .add-subject-form-section {
            padding: 1.5rem;
          }

          .btn-action {
            padding: 0.5rem 0.8rem;
            font-size: 1rem;
          }

          .subject-enrollment-panel {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .page-container {
            padding: 1rem;
          }

          .btn-action {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 0.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
