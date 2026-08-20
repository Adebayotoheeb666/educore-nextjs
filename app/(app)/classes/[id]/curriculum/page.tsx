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
  const [newSubjectCompulsory, setNewSubjectCompulsory] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [studentsInSubject, setStudentsInSubject] = useState<Record<string, StudentInSubject[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<Record<string, boolean>>({});
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [showOptionalAssignment, setShowOptionalAssignment] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, Set<string>>>({});
  const [assigningOptional, setAssigningOptional] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initializeClass = async () => {
      try {
        const res = await authenticatedFetch(`/api/classes/${classId}`);
        if (res.ok) {
          const data = await res.json();
          const classData = data.data || data;
          const academicSession = classData.academic_session || "";
          setSession(academicSession);
        }
      } catch (err) {
        console.error("Failed to fetch class:", err);
      }
    };
    initializeClass();
  }, [classId]);

  useEffect(() => {
    fetchCurriculumData();
  }, [classId, session]);

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  // Auto-open the add-subject form when there are no subjects
  useEffect(() => {
    if (!loading && subjects.length === 0) {
      setShowAddSubject(true);
    }
  }, [loading, subjects.length]);

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
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject");
      return;
    }

    try {
      const payload: any = {
        subjectId: selectedSubjectId,
        isCompulsory: newSubjectCompulsory,
        sequence: (subjects.length || 0) + 1,
      };

      if (session && session.trim()) {
        payload.academicSession = session;
      }

      const res = await authenticatedFetch(`/api/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to add subject");
      }
      setSelectedSubjectId("");
      setShowAddSubject(false);
      setNewSubjectCompulsory(false);
      setError(null);
      fetchCurriculumData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Failed to add subject:", err);
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

  const handleToggleCompulsory = async (subjectId: string, currentValue: number) => {
    try {
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(
        `/api/classes/${classId}/subjects/${subjectId}${sessionParam}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isCompulsory: !currentValue,
            academicSession: session || undefined,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to update subject type");
      }
      setError(null);
      await fetchCurriculumData();
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

  const requiredCount = subjects.filter(s => s.is_compulsory).length;
  const electiveCount = subjects.filter(s => !s.is_compulsory).length;

  return (
    <div className="curriculum-page">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>📚 Curriculum & Subjects</h1>
          <p>Design and manage your class curriculum with subjects, teachers, and students</p>
        </div>
        <Link href={`/classes/${classId}`} className="btn-outline">
          ← Back
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="alert-close">✕</button>
        </div>
      )}

      {/* Session Selector */}
      <div className="session-row">
        <div className="session-input-wrap">
          <label>📅 Academic Session</label>
          <input
            type="text"
            placeholder="e.g., 2024/2025"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="session-input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && subjects.length > 0 && (
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <div className="stat-value">{subjects.length}</div>
              <div className="stat-label">Total Subjects</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{requiredCount}</div>
              <div className="stat-label">Required</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">⭕</div>
            <div className="stat-info">
              <div className="stat-value">{electiveCount}</div>
              <div className="stat-label">Elective</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="curriculum-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading curriculum...</p>
          </div>
        ) : (
          <>
            {/* Add Subject Section */}
            <div className="add-subject-card">
              <div className="add-subject-header">
                <h3>Manage Curriculum</h3>
                <button
                  className={`btn-primary ${showAddSubject ? 'active' : ''}`}
                  onClick={() => {
                    setShowAddSubject(!showAddSubject);
                    setSelectedSubjectId("");
                  }}
                >
                  {showAddSubject ? '✕ Cancel' : '➕ Add Subject'}
                </button>
              </div>

              {showAddSubject && (
                <div className="add-subject-form">
                  {allSubjects.length === 0 ? (
                    <div className="form-empty">
                      <p>No subjects available. Please create subjects first.</p>
                    </div>
                  ) : availableSubjects.length === 0 ? (
                    <div className="form-empty">
                      <p>✅ All available subjects have been added to this class.</p>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Select Subject to Add ({availableSubjects.length} available)</label>
                      <div className="select-wrapper">
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="form-select"
                        >
                          <option value="">Choose a subject...</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} {subject.code ? `(${subject.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="compulsory-row">
                        <label className="compulsory-check">
                          <input
                            type="checkbox"
                            checked={newSubjectCompulsory}
                            onChange={(e) => setNewSubjectCompulsory(e.target.checked)}
                          />
                          <span>Compulsory — auto-assign to all students in this class</span>
                        </label>
                      </div>
                      <button
                        className="btn-primary btn-submit"
                        onClick={handleAddSubject}
                      >
                        Add to Curriculum
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subjects Grid — only show if subjects exist */}
            {subjects.length > 0 && (
              <div className="subjects-grid">
                {subjects.map((subject) => (
                <div key={subject.id} className="subject-card">
                  <div className="card-header">
                    <div className="subject-meta">
                      <span className="sequence">#{subject.sequence}</span>
                      <span className={`type-badge ${subject.is_compulsory ? 'required' : 'elective'}`}>
                        {subject.is_compulsory ? '✓ Required' : '◯ Elective'}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <h4 className="subject-title">
                      {subject.subject_id ? (
                        <Link href={`/subjects/${subject.subject_id}`}>
                          {subject.name}
                        </Link>
                      ) : (
                        subject.name
                      )}
                    </h4>
                    {subject.code && <span className="subject-code">{subject.code}</span>}

                    <div className="subject-details">
                      <div className="detail-item">
                        <span className="detail-label">👨‍🏫 Teachers</span>
                        <span className="detail-value">
                          {subject.teacher_count > 0 ? (
                            <>
                              {subject.teacher_names}
                              <span className="teacher-count">({subject.teacher_count})</span>
                            </>
                          ) : (
                            <span className="no-value">Not assigned</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn teachers-btn"
                      onClick={() => window.location.href = `/subjects/${subject.subject_id}`}
                      title="Manage teachers"
                    >
                      👨‍🏫 Teachers
                    </button>
                    <button
                      className={`action-btn students-btn ${expandedSubject === subject.subject_id ? 'active' : ''}`}
                      onClick={() => toggleExpandSubject(subject.subject_id)}
                      title="View students"
                    >
                      {expandedSubject === subject.subject_id ? '▼' : '▶'} Students
                    </button>
                    {!subject.is_compulsory && (
                      <button
                        className="action-btn assign-btn"
                        onClick={() => {
                          setShowOptionalAssignment(subject.subject_id);
                          if (classStudents.length === 0) {
                            fetchClassStudents();
                          }
                        }}
                      >
                        ➕ Assign
                      </button>
                    )}
                    <button
                      className={`action-btn ${subject.is_compulsory ? 'elective-btn' : 'required-btn'}`}
                      onClick={() => handleToggleCompulsory(subject.subject_id, subject.is_compulsory)}
                      title={subject.is_compulsory ? "Make this an optional subject" : "Make this subject compulsory for all students"}
                    >
                      {subject.is_compulsory ? '◯ Make Elective' : '✓ Make Required'}
                    </button>
                    <button
                      className="action-btn remove-btn"
                      onClick={() => handleRemoveSubject(subject.subject_id)}
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  {/* Expanded Students List */}
                  {expandedSubject === subject.subject_id && (
                    <div className="card-expansion">
                      <div className="expansion-header">
                        <h5>Students in this Subject</h5>
                      </div>
                      {loadingStudents[subject.subject_id] ? (
                        <div className="expansion-loading">Loading students...</div>
                      ) : !studentsInSubject[subject.subject_id] || studentsInSubject[subject.subject_id].length === 0 ? (
                        <div className="expansion-empty">No students enrolled yet</div>
                      ) : (
                        <div className="students-list">
                          {(studentsInSubject[subject.subject_id] || []).map((student) => (
                            <div key={student.id} className="student-row">
                              <div className="student-info">
                                <div className="student-name">{student.name}</div>
                                <div className="student-meta">
                                  <span>{student.admission_no}</span>
                                  <span className="status-badge">{student.status}</span>
                                </div>
                              </div>
                              <button
                                className="remove-student-btn"
                                onClick={() => handleRemoveStudentFromSubject(subject.subject_id, student.student_id)}
                                title="Remove student"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Optional Assignment */}
      {showOptionalAssignment && (
        <div className="modal-overlay" onClick={() => setShowOptionalAssignment(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Students to {subjects.find((s) => s.subject_id === showOptionalAssignment)?.name}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowOptionalAssignment(null);
                  setSelectedStudentIds((prev) => {
                    const updated = { ...prev };
                    delete updated[showOptionalAssignment];
                    return updated;
                  });
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingClassStudents ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
              ) : getAvailableStudentsForSubject(showOptionalAssignment).length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  All students are already assigned ✅
                </div>
              ) : (
                <>
                  <div className="select-all-box">
                    <label>
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
                      />
                      <span>Select All</span>
                    </label>
                  </div>

                  <div className="students-checklist">
                    {getAvailableStudentsForSubject(showOptionalAssignment).map((student) => (
                      <label key={student.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={(selectedStudentIds[showOptionalAssignment] || new Set()).has(student.id)}
                          onChange={() => toggleStudentSelection(showOptionalAssignment, student.id)}
                        />
                        <span className="checkbox-label">
                          <div>{student.name}</div>
                          <div className="checkbox-meta">{student.admission_no}</div>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
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
                  ? 'Assigning...'
                  : `Assign ${(selectedStudentIds[showOptionalAssignment] || new Set()).size} Student${(selectedStudentIds[showOptionalAssignment] || new Set()).size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .curriculum-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .page-header-text h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .page-header-text p {
          margin: 0;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .alert-error {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #991b1b;
          margin-bottom: 2rem;
          font-weight: 600;
        }

        .alert-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          color: #991b1b;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .session-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .session-input-wrap {
          flex: 1;
          max-width: 300px;
        }

        .session-input-wrap label {
          display: block;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          color: var(--text-main);
        }

        .session-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
          background: var(--input-bg);
          color: var(--text-main);
        }

        .session-input:focus {
          border-color: var(--input-border-focus);
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-top: 0.3rem;
        }

        .curriculum-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--bg-hover);
          border-radius: 16px;
          border: 2px dashed var(--border-color);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          margin: 0 0 0.5rem 0;
          color: var(--text-main);
          font-size: 1.8rem;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          color: var(--text-muted);
        }

        .btn-lg {
          padding: 1rem 2rem !important;
          font-size: 1.1rem !important;
        }

        .add-subject-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
        }

        .add-subject-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-hover);
        }

        .add-subject-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: var(--text-main);
        }

        .add-subject-form {
          padding: 1.5rem;
          background: var(--bg-card);
        }

        .form-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group label {
          font-weight: 700;
          color: var(--text-main);
        }

        .select-wrapper {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .form-select {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          background: var(--select-bg);
          color: var(--text-main);
          cursor: pointer;
          outline: none;
        }

        .form-select:focus {
          border-color: var(--input-border-focus);
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .btn-submit {
          align-self: flex-end;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .subject-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-card);
        }

        .subject-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-card-hover);
          transform: translateY(-2px);
        }

        .card-header {
          padding: 1rem 1.5rem;
          background: var(--bg-hover);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .subject-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .sequence {
          font-weight: 700;
          color: #667eea;
          font-size: 0.95rem;
        }

        .type-badge {
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-block;
        }

        .type-badge.required {
          background: #dbeafe;
          color: #1e40af;
        }

        .type-badge.elective {
          background: #fef3c7;
          color: #92400e;
        }

        .card-body {
          padding: 1.5rem;
        }

        .subject-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .subject-title a {
          color: #667eea;
          text-decoration: none;
          transition: color 0.2s;
        }

        .subject-title a:hover {
          color: #5a67d8;
          text-decoration: underline;
        }

        .subject-code {
          display: inline-block;
          background: var(--bg-hover);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-family: monospace;
          margin-bottom: 1rem;
        }

        .subject-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-item {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          font-size: 0.95rem;
        }

        .detail-label {
          font-weight: 600;
          color: var(--text-muted);
          min-width: 80px;
        }

        .detail-value {
          color: var(--text-main);
          flex: 1;
        }

        .teacher-count {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .no-value {
          color: #ea580c;
          font-weight: 600;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-hover);
          flex-wrap: wrap;
        }

        .action-btn {
          flex: 1;
          min-width: 80px;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background: var(--bg-card);
          color: var(--text-main);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .teachers-btn {
          border-color: #fde68a;
          color: #92400e;
        }

        .teachers-btn:hover {
          background: #fef3c7;
          border-color: #fbbf24;
        }

        .students-btn {
          border-color: #ddd6fe;
          color: #4f46e5;
        }

        .students-btn:hover,
        .students-btn.active {
          background: #e0e7ff;
          border-color: #c7d2fe;
        }

        .assign-btn {
          border-color: #bbf7d0;
          color: #16a34a;
        }

        .assign-btn:hover {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .required-btn {
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .required-btn:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .elective-btn {
          border-color: #fde68a;
          color: #b45309;
        }

        .elective-btn:hover {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .compulsory-row {
          padding: 0.5rem 0;
        }

        .compulsory-check {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-main);
        }

        .compulsory-check input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .remove-btn {
          border-color: #fecaca;
          color: #dc2626;
        }

        .remove-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .card-expansion {
          border-top: 1px solid var(--border-color);
          padding: 1.5rem;
          background: var(--bg-hover);
        }

        .expansion-header {
          margin-bottom: 1rem;
        }

        .expansion-header h5 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-main);
          font-weight: 700;
        }

        .expansion-loading,
        .expansion-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .students-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .student-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .student-row:hover {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .student-info {
          flex: 1;
        }

        .student-name {
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 0.2rem;
        }

        .student-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .status-badge {
          background: #d1fae5;
          color: #065f46;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .remove-student-btn {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .remove-student-btn:hover {
          background: #fef2f2;
          border-radius: 6px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-dialog {
          background: var(--bg-card);
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          box-shadow: var(--shadow-modal);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-hover);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: var(--text-main);
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          color: var(--text-muted);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--border-color);
          color: var(--text-main);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .select-all-box {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .select-all-box label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-main);
        }

        .select-all-box input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .students-checklist {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .checkbox-item:hover {
          background: var(--bg-hover);
        }

        .checkbox-item input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .checkbox-label {
          flex: 1;
        }

        .checkbox-label div:first-child {
          font-weight: 600;
          color: var(--text-main);
        }

        .checkbox-meta {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-hover);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .curriculum-page {
            padding: 1.5rem;
          }

          .page-header-row {
            flex-direction: column;
            gap: 1rem;
          }

          .subjects-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .add-subject-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
