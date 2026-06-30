"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils/fetch";

interface ClassStructure {
  class: {
    id: string;
    name: string;
    level: string;
    class_teacher_name: string;
    class_teacher_email: string;
  };
  subjects: Array<{
    id: string;
    sequence: number;
    subject_id: string;
    name: string;
    code: string;
    is_compulsory: number;
    teacher_names: string;
    teacher_count: number;
  }>;
  enrollmentStats: {
    total_enrolled: number;
    active: number;
    transferred: number;
    promoted: number;
    graduated: number;
  };
}

export default function ClassOverviewPage() {
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [data, setData] = useState<ClassStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState("");

  useEffect(() => {
    fetchClassStructure();
  }, [classId, session]);

  const fetchClassStructure = async () => {
    try {
      setLoading(true);
      const sessionParam = session ? `?session=${session}` : "";
      const res = await authenticatedFetch(`/api/classes/${classId}/structure${sessionParam}`);

      if (!res.ok) throw new Error("Failed to fetch class structure");
      const classData = await res.json();
      setData(classData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading class overview...</p></div>;
  if (!data) return <div className="page-container"><p className="text-error">Class not found</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{data.class.name}</h1>
          <p className="text-muted">Level: {data.class.level}</p>
        </div>
        <Link href={`/classes/${classId}`} className="btn-outline">
          ← Back
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

      {/* Class Teacher Card */}
      <div className="card">
        <div className="card-header">
          <h2>Class Teacher (Form Master)</h2>
        </div>
        <div className="teacher-card">
          <div className="teacher-info">
            <h3>{data.class.class_teacher_name || "Not assigned"}</h3>
            {data.class.class_teacher_email && (
              <p className="text-muted">{data.class.class_teacher_email}</p>
            )}
          </div>
          <Link href={`/classes/${classId}/class-teacher`} className="btn-outline">
            Edit
          </Link>
        </div>
      </div>

      {/* Enrollment Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.enrollmentStats.total_enrolled}</div>
          <div className="stat-label">Total Enrolled</div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-value">{data.enrollmentStats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card stat-promoted">
          <div className="stat-value">{data.enrollmentStats.promoted}</div>
          <div className="stat-label">Promoted</div>
        </div>
        <div className="stat-card stat-graduated">
          <div className="stat-value">{data.enrollmentStats.graduated}</div>
          <div className="stat-label">Graduated</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link href={`/classes/${classId}/enrollment`} className="quick-link-btn">
          📋 Manage Enrollment
        </Link>
        <Link href={`/classes/${classId}/curriculum`} className="quick-link-btn">
          📚 Manage Curriculum
        </Link>
        <Link href={`/classes/${classId}/students`} className="quick-link-btn">
          👥 View Students
        </Link>
      </div>

      {/* Curriculum Section */}
      <div className="card">
        <div className="card-header flex-between">
          <h2>Curriculum ({data.subjects.length} subjects)</h2>
          <Link href={`/classes/${classId}/curriculum`} className="btn-primary">
            ➕ Manage Curriculum
          </Link>
        </div>

        {data.subjects.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">No subjects added to this class yet</p>
            <p>
              <Link href={`/classes/${classId}/curriculum`} className="link">
                Add subjects to the curriculum
              </Link>
            </p>
          </div>
        ) : (
          <div className="subject-grid">
            {data.subjects.map((subject) => (
              <div key={subject.id} className="subject-card">
                <div className="subject-header">
                  <h3>
                    {subject.subject_id ? (
                      <Link href={`/subjects/${subject.subject_id}`} className="subject-link">
                        {subject.name}
                      </Link>
                    ) : (
                      <span>{subject.name}</span>
                    )}
                  </h3>
                  <span className={`badge ${subject.is_compulsory ? "badge-required" : "badge-elective"}`}>
                    {subject.is_compulsory ? "Required" : "Elective"}
                  </span>
                </div>

                {subject.code && <p className="subject-code">Code: {subject.code}</p>}

                <div className="teachers-section">
                  <p className="section-label">Teachers:</p>
                  {subject.teacher_count > 0 ? (
                    <div className="teacher-names">
                      {subject.teacher_names}
                    </div>
                  ) : (
                    <p className="text-warning">⚠️ No teachers assigned</p>
                  )}
                </div>

                <Link
                  href={`/subjects/${subject.subject_id}/assignments?class=${classId}`}
                  className="manage-link"
                >
                  Manage Teachers →
                </Link>
              </div>
            ))}
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
        .teacher-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: var(--bg-card);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .teacher-info h3 {
          margin: 0;
          font-size: 18px;
        }
        .teacher-info p {
          margin: 4px 0 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-active {
          background: linear-gradient(135deg, #67bb6a 0%, #4b8b3b 100%);
        }
        .stat-promoted {
          background: linear-gradient(135deg, #ffa500 0%, #cc8400 100%);
        }
        .stat-graduated {
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
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
        .quick-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 24px 0;
        }
        .quick-link-btn {
          padding: 16px;
          text-align: center;
          background: var(--bg-card);
          border: 2px solid var(--primary);
          border-radius: 6px;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .quick-link-btn:hover {
          background: var(--primary);
          color: white;
        }
        .subject-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          padding: 16px 0;
        }
        .subject-card {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          background: var(--bg-card);
          transition: all 0.2s;
        }
        .subject-card:hover {
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(145, 131, 255, 0.1);
        }
        .subject-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .subject-header h3 {
          margin: 0;
          font-size: 16px;
        }
        .subject-link {
          color: var(--primary);
          text-decoration: none;
        }
        .subject-link:hover {
          text-decoration: underline;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-required {
          background: var(--badge-green-bg);
          color: var(--badge-green-text);
        }
        .badge-elective {
          background: var(--badge-blue-bg);
          color: var(--badge-blue-text);
        }
        .subject-code {
          margin: 8px 0;
          font-size: 12px;
          color: var(--text-muted);
        }
        .teachers-section {
          margin: 12px 0;
        }
        .section-label {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .teacher-names {
          margin-top: 4px;
          font-size: 13px;
          line-height: 1.5;
        }
        .text-warning {
          color: #ff9800;
          font-size: 13px;
        }
        .manage-link {
          display: inline-block;
          margin-top: 12px;
          color: var(--primary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }
        .manage-link:hover {
          text-decoration: underline;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
        }
        .link {
          color: var(--primary);
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
