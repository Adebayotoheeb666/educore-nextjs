"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";

interface Student {
  id: string;
  name: string;
  admission_no: string;
  email: string;
}

interface ClassOption {
  id: string;
  name: string;
  level?: string;
  section?: string;
}

interface EnrollmentStats {
  total?: number;
  total_enrolled?: number;
  active: number;
  transferred?: number;
  promoted?: number;
  graduated?: number;
  retained?: number;
  withdrawn?: number;
}

export default function ClassEnrollmentPage() {
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState("");
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSchoolSession();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchEnrollmentData();
  }, [classId, session]);

  const fetchSchoolSession = async () => {
    try {
      const res = await authenticatedFetch("/api/school");
      if (!res.ok) return;
      const data = await res.json();
      const academicSession = data.data?.academic_session ?? data.academic_session ?? "";
      if (academicSession) {
        setSessionOptions([academicSession]);
        setSession(academicSession);
      }
    } catch {
      // ignore
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await authenticatedFetch("/api/classes");
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setClasses(list);
    } catch {
      // ignore
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionParam = session ? `?session=${session}` : "";

      const [statsRes, studentsRes, allRes] = await Promise.all([
        authenticatedFetch(`/api/classes/${classId}/enroll-students${sessionParam}`),
        authenticatedFetch(`/api/classes/${classId}/students${sessionParam}`),
        authenticatedFetch(`/api/students`),
      ]);

      // Handle stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const statsObj = statsData.data?.stats || statsData.stats || {};
        // Transform API response to match our interface
        setStats({
          total_enrolled: statsObj.total || 0,
          active: statsObj.active || 0,
          transferred: statsObj.transferred || 0,
          promoted: statsObj.promoted || 0,
          graduated: statsObj.graduated || 0,
          retained: statsObj.retained || 0,
          withdrawn: statsObj.withdrawn || 0,
        });
      } else {
        setError(`Failed to load enrollment stats (${statsRes.status})`);
      }

      // Handle enrolled students
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);
        setStudents(studentsList);
      } else if (studentsRes.status !== 404) {
        setError(`Failed to load enrolled students (${studentsRes.status})`);
      }

      // Handle all students
      if (allRes.ok) {
        const allData = await allRes.json();
        const allList = Array.isArray(allData) ? allData : (allData.data || []);
        setAllStudents(allList);
      } else {
        setError(`Failed to load available students (${allRes.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student");
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await authenticatedFetch(`/api/classes/${classId}/enroll-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
          academicSession: session,
          term: "first",
        }),
      });

      if (!res.ok) throw new Error("Failed to enroll students");
      const result = await res.json();
      const data = result.data ?? result;

      setError(null);
      alert(
        `✓ Enrolled: ${data.enrolled?.length ?? 0}, Duplicates: ${data.duplicates?.length ?? 0}, Failed: ${data.failed?.length ?? 0}`
      );

      setSelectedStudents([]);
      setSelectAll(false);
      setShowBulkEnroll(false);
      fetchEnrollmentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePromote = async (studentId: string, toClassId: string) => {
    if (!toClassId) return;
    setProcessingId(studentId);
    try {
      const res = await authenticatedFetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromClassId: classId,
          toClassId,
          studentIds: [studentId],
          academicSession: session,
        }),
      });

      if (!res.ok) throw new Error("Failed to promote student");
      const result = await res.json();
      const data = result.data ?? result;

      setError(null);
      alert(data.message || "Student promoted successfully");
      setPromoteTarget((prev) => ({ ...prev, [studentId]: "" }));
      fetchEnrollmentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGraduate = async (studentId: string) => {
    if (!window.confirm("Mark this student as graduated? This will remove them from active enrollment.")) return;
    setProcessingId(studentId);
    try {
      const res = await authenticatedFetch("/api/students/graduate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          studentIds: [studentId],
          academicSession: session,
        }),
      });

      if (!res.ok) throw new Error("Failed to mark student as graduated");
      const result = await res.json();
      const data = result.data ?? result;

      setError(null);
      alert(data.message || "Student marked as graduated");
      fetchEnrollmentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const promoteTargets = useMemo(() => {
    return classes
      .filter((c) => c.id !== classId)
      .sort((a, b) => (a.level || "").localeCompare(b.level || "") || a.name.localeCompare(b.name));
  }, [classes, classId]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(filteredAvailableStudents.map((s) => s.id));
      setSelectAll(true);
    }
  };

  const enrolledStudentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const availableStudents = useMemo(() => {
    return allStudents.filter((s) => !enrolledStudentIds.has(s.id));
  }, [allStudents, enrolledStudentIds]);

  const filteredAvailableStudents = useMemo(() => {
    return availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admission_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableStudents, searchQuery]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "1.4rem", color: "#64748b" }}>Loading enrollment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Class Enrollment Manager</h1>
          <p>Manage student enrollment for this class</p>
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
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="enrollment-input"
          disabled={sessionOptions.length === 0}
        >
          <option value="">Select academic session</option>
          {sessionOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="enrollment-stats-grid">
          <div className="enrollment-stat-card">
            <div className="enrollment-stat-number">{stats.total_enrolled ?? 0}</div>
            <div className="enrollment-stat-label">Total Enrolled</div>
          </div>
          <div className="enrollment-stat-card enrollment-stat-active">
            <div className="enrollment-stat-number">{stats.active ?? 0}</div>
            <div className="enrollment-stat-label">Active</div>
          </div>
          <div className="enrollment-stat-card enrollment-stat-promoted">
            <div className="enrollment-stat-number">{stats.promoted ?? 0}</div>
            <div className="enrollment-stat-label">Promoted</div>
          </div>
          <div className="enrollment-stat-card enrollment-stat-graduated">
            <div className="enrollment-stat-number">{stats.graduated ?? 0}</div>
            <div className="enrollment-stat-label">Graduated</div>
          </div>
        </div>
      )}

      <div className="premium-table-card" style={{ marginBottom: "2rem" }}>
        <div style={{ padding: "2rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>
            Enrolled Students ({students.length})
          </h2>
          <button
            className="btn-primary"
            onClick={() => {
              setShowBulkEnroll(!showBulkEnroll);
              setSearchQuery("");
            }}
          >
            {showBulkEnroll ? "Cancel Enrollment" : "👥 Add Students"}
          </button>
        </div>

        {!showBulkEnroll && (
          <div style={{ padding: "2rem" }}>
            {students.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                <p style={{ fontSize: "1.3rem" }}>No students enrolled yet</p>
                <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>Click "Add Students" to begin enrollment</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Admission No.</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{student.name}</td>
                        <td><span className="mono">{student.admission_no}</span></td>
                        <td>{student.email}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
                            <select
                              value={promoteTarget[student.id] || ""}
                              disabled={processingId === student.id || promoteTargets.length === 0}
                              onChange={(e) => {
                                const toClassId = e.target.value;
                                setPromoteTarget((prev) => ({ ...prev, [student.id]: toClassId }));
                                handlePromote(student.id, toClassId);
                              }}
                              className="enrollment-action-select"
                              title={promoteTargets.length === 0 ? "No other classes available" : "Promote to next class"}
                            >
                              <option value="">Promote to…</option>
                              {promoteTargets.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}{c.level ? ` (${c.level})` : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              className="enrollment-action-btn enrollment-action-graduate"
                              onClick={() => handleGraduate(student.id)}
                              disabled={processingId === student.id}
                              style={{ opacity: processingId === student.id ? 0.6 : 1, cursor: processingId === student.id ? "not-allowed" : "pointer" }}
                            >
                              {processingId === student.id ? "Processing…" : "Graduate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showBulkEnroll && (
          <div className="bulk-enrollment-form">
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                  Available Students ({filteredAvailableStudents.length} of {allStudents.length})
                </h3>
              </div>

              {allStudents.length === 0 && (
                <div style={{ padding: "1.2rem", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "8px", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "1.2rem", color: "#92400e", margin: 0 }}>
                    ⚠️ No students found in the system. Please create students first.
                  </p>
                </div>
              )}

              {allStudents.length > 0 && (
                <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                  <span style={{ position: "absolute", left: "1.5rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.4rem" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name, admission no., or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-enrollment"
                  />
                </div>
              )}

              {allStudents.length > 0 && availableStudents.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                  <p style={{ fontSize: "1.3rem" }}>All {allStudents.length} students are already enrolled in this class</p>
                </div>
              ) : allStudents.length > 0 && filteredAvailableStudents.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                  <p style={{ fontSize: "1.3rem" }}>No students match your search</p>
                </div>
              ) : allStudents.length > 0 ? (
                <>
                  <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectAll && filteredAvailableStudents.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span style={{ fontWeight: 600 }}>
                        Select All ({filteredAvailableStudents.length})
                      </span>
                    </label>
                  </div>
                  <div className="student-checklist-grid">
                    {filteredAvailableStudents.map((student) => (
                      <label key={student.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                        <div className="student-info-stack">
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{student.name}</span>
                          <span style={{ fontSize: "1.1rem", color: "#64748b" }}>{student.admission_no}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>
              <button
                className="btn-primary"
                onClick={handleBulkEnroll}
                disabled={selectedStudents.length === 0 || isEnrolling}
                style={{ opacity: isEnrolling ? 0.7 : 1, cursor: isEnrolling ? "not-allowed" : "pointer" }}
              >
                {isEnrolling ? (
                  <>
                    <span style={{ display: "inline-block", marginRight: "0.5rem", animation: "spin 1s linear infinite" }}>⏳</span>
                    Adding {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}...
                  </>
                ) : (
                  <>Enroll {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}</>
                )}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBulkEnroll(false);
                  setSelectedStudents([]);
                  setSelectAll(false);
                  setSearchQuery("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .enrollment-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .enrollment-stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .enrollment-stat-active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .enrollment-stat-promoted {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }

        .enrollment-stat-graduated {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .enrollment-stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .enrollment-stat-label {
          font-size: 1.2rem;
          opacity: 0.95;
          font-weight: 600;
        }

        .enrollment-input {
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

        .enrollment-input:focus {
          border-color: #6A5ACD;
          background: var(--bg-card);
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .enrollment-action-select {
          padding: 0.7rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1.2rem;
          background: var(--bg-card);
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .enrollment-action-select:focus {
          border-color: #6A5ACD;
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .enrollment-action-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .enrollment-action-btn {
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          font-size: 1.2rem;
          font-weight: 600;
          border: none;
          transition: all 0.15s;
        }

        .enrollment-action-graduate {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .enrollment-action-graduate:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        .bulk-enrollment-form {
          padding: 2rem;
        }

        .search-input-enrollment {
          width: 100%;
          padding: 1rem 1.5rem 1rem 4rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1.3rem;
          background: var(--bg-card);
          color: var(--text-main);
          outline: none;
          transition: all 0.15s;
        }

        .search-input-enrollment:focus {
          border-color: #6A5ACD;
          box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.1);
        }

        .student-checklist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.2rem;
          background: var(--bg-card);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .checkbox-label:hover {
          background: #f8fafc;
          border-color: #d1d5db;
        }

        .checkbox-label input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #6A5ACD;
          margin-top: 0.2rem;
          flex-shrink: 0;
        }

        .student-info-stack {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
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

          .enrollment-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .enrollment-stat-number {
            font-size: 2rem;
          }

          .enrollment-stat-label {
            font-size: 1rem;
          }

          .student-checklist-grid {
            grid-template-columns: 1fr;
          }

          .bulk-enrollment-form {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .enrollment-stats-grid {
            grid-template-columns: 1fr;
          }

          .enrollment-stat-card {
            padding: 1.5rem;
          }

          .enrollment-stat-number {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}
