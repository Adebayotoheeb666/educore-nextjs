"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  class_name: string;
  class_level: string;
  class_section: string;
  academic_session: string;
  term: string;
  status: "active" | "transferred" | "promoted" | "retained" | "graduated" | "withdrawn";
  enrolled_date: string;
  left_date: string | null;
}

export default function StudentEnrollmentsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewEnrollment, setShowNewEnrollment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    classId: "",
    academicSession: "",
    term: "",
    status: "active",
  });

  useEffect(() => {
    fetchEnrollments();
  }, [studentId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/students/${studentId}/enrollments`);
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      const data = await res.json();
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/students/${studentId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create enrollment");
      setFormData({ classId: "", academicSession: "", term: "", status: "active" });
      setShowNewEnrollment(false);
      fetchEnrollments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (enrollmentId: string, newStatus: string, leftDate?: string) => {
    try {
      const res = await authenticatedFetch(`/api/students/${studentId}/enrollments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          status: newStatus,
          leftDate: leftDate || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update enrollment");
      fetchEnrollments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      active: "status-badge status-active",
      transferred: "status-badge status-transferred",
      promoted: "status-badge status-promoted",
      retained: "status-badge status-retained",
      graduated: "status-badge status-graduated",
      withdrawn: "status-badge status-withdrawn",
    };
    return classes[status] || "status-badge";
  };

  if (loading) return <div className="page-container"><p>Loading enrollments...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Enrollment History</h1>
          <p className="text-muted">Student ID: {studentId}</p>
        </div>
        <Link href={`/students/${studentId}`} className="btn-outline">
          ← Back to Profile
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header flex-between">
          <h2>Enrollments</h2>
          <button
            className="btn-primary"
            onClick={() => setShowNewEnrollment(!showNewEnrollment)}
          >
            {showNewEnrollment ? "Cancel" : "➕ Add Enrollment"}
          </button>
        </div>

        {showNewEnrollment && (
          <form onSubmit={handleEnrollmentSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Class</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  required
                >
                  <option value="">Select class</option>
                </select>
              </div>
              <div className="form-group">
                <label>Academic Session</label>
                <input
                  type="text"
                  placeholder="e.g., 2024/2025"
                  value={formData.academicSession}
                  onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Term</label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                >
                  <option value="">-- Any --</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: "inline-block", marginRight: "0.5rem", animation: "spin 1s linear infinite" }}>⏳</span>
                  Adding Student to Class...
                </>
              ) : (
                <>Create Enrollment</>
              )}
            </button>
          </form>
        )}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Class</th>
                <th>Term</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No enrollments found
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="font-bold">{enrollment.academic_session}</td>
                    <td>
                      {enrollment.class_name} ({enrollment.class_level})
                    </td>
                    <td>{enrollment.term || "—"}</td>
                    <td>
                      <span className={getStatusBadgeClass(enrollment.status)}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {new Date(enrollment.enrolled_date).toLocaleDateString()}
                    </td>
                    <td className="text-sm">
                      {enrollment.left_date
                        ? new Date(enrollment.left_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {enrollment.status === "active" && (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(enrollment.id, e.target.value);
                            }
                          }}
                          className="input-small"
                        >
                          <option value="">Change Status</option>
                          <option value="transferred">Transfer</option>
                          <option value="promoted">Promote</option>
                          <option value="retained">Retain</option>
                          <option value="graduated">Graduate</option>
                          <option value="withdrawn">Withdraw</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-active {
          background: #d4edda;
          color: #155724;
        }
        .status-transferred {
          background: #cfe2ff;
          color: #084298;
        }
        .status-promoted {
          background: #d1ecf1;
          color: #0c5460;
        }
        .status-retained {
          background: #fff3cd;
          color: #664d03;
        }
        .status-graduated {
          background: #d1e7dd;
          color: #0f5132;
        }
        .status-withdrawn {
          background: #f8d7da;
          color: #842029;
        }
        .input-small {
          padding: 4px 8px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
