"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  admission_no: string;
  email: string;
}

interface EnrollmentStats {
  total_enrolled: number;
  active: number;
  transferred: number;
  promoted: number;
  graduated: number;
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);

  useEffect(() => {
    fetchEnrollmentData();
  }, [classId, session]);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const sessionParam = session ? `?session=${session}` : "";

      // Fetch enrollment stats
      const statsRes = await fetch(`/api/classes/${classId}/enroll-students${sessionParam}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch enrolled students
      const studentsRes = await fetch(`/api/classes/${classId}/students${sessionParam}`);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch all school students for selection
      const allRes = await fetch(`/api/students`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllStudents(allData);
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

    try {
      const res = await fetch(`/api/classes/${classId}/enroll-students`, {
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

      alert(
        `Enrolled: ${result.enrolled.length}, Duplicates: ${result.duplicates.length}, Failed: ${result.failed.length}`
      );

      setSelectedStudents([]);
      setShowBulkEnroll(false);
      fetchEnrollmentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const enrolledStudentIds = students.map((s) => s.id);
  const availableStudents = allStudents.filter((s) => !enrolledStudentIds.includes(s.id));

  if (loading) return <div className="page-container"><p>Loading enrollment data...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Class Enrollment Manager</h1>
          <p className="text-muted">Manage student enrollment for this class</p>
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

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_enrolled}</div>
            <div className="stat-label">Total Enrolled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.promoted}</div>
            <div className="stat-label">Promoted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.graduated}</div>
            <div className="stat-label">Graduated</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header flex-between">
          <h2>Enrolled Students ({students.length})</h2>
          <button className="btn-primary" onClick={() => setShowBulkEnroll(!showBulkEnroll)}>
            {showBulkEnroll ? "Cancel" : "➕ Bulk Enroll"}
          </button>
        </div>

        {showBulkEnroll && (
          <div className="bulk-enroll-section">
            <h3>Available Students ({availableStudents.length})</h3>
            <div className="student-checklist">
              {availableStudents.length === 0 ? (
                <p className="text-muted">All students are already enrolled in this class</p>
              ) : (
                availableStudents.map((student) => (
                  <label key={student.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                    />
                    <span>
                      {student.name} ({student.admission_no})
                    </span>
                  </label>
                ))
              )}
            </div>
            <button
              className="btn-primary"
              onClick={handleBulkEnroll}
              disabled={selectedStudents.length === 0}
            >
              Enroll {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission No.</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted">
                    No students enrolled
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="font-bold">{student.name}</td>
                    <td>{student.admission_no}</td>
                    <td>{student.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
        .bulk-enroll-section {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .student-checklist {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 8px;
          margin: 16px 0;
          max-height: 400px;
          overflow-y: auto;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          cursor: pointer;
        }
        .checkbox-item input {
          cursor: pointer;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
