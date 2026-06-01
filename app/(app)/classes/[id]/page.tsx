"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ClassDetail {
  id: string;
  name: string;
  section?: string;
  level?: string;
  class_teacher_id?: string;
  teacher_name?: string;
  teacher_email?: string;
  capacity?: number;
  created_at?: string;
  updated_at?: string;
}

interface ClassStudent {
  id: string;
  name: string;
  admission_no?: string;
  avatar?: string;
  email?: string;
}

interface ClassSubject {
  id: string;
  name: string;
  code?: string;
  is_compulsory?: number;
  teacher_names?: string;
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Tab State & Interactive Filter
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "subjects">("overview");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRes = await authenticatedFetch(`/api/classes/${id}`);
        const classJson = await classRes.json();
        setClassData(classJson.data ?? null);

        const studentsRes = await authenticatedFetch(`/api/classes/${id}/students`);
        const studentsJson = await studentsRes.json();
        const studentsData = studentsJson.data ?? studentsJson;
        setStudents(Array.isArray(studentsData) ? studentsData : []);

        const subjectsRes = await authenticatedFetch(`/api/classes/${id}/subjects`);
        const subjectsJson = await subjectsRes.json();
        const subjectsData = subjectsJson.data ?? subjectsJson;
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch (err) {
        toast.error("Failed to load class");
      } finally {
        setLoading(false);
      }
    };
    fetchClassData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Delete class "${classData?.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Class deleted successfully");
      router.push("/classes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading Class Dashboard...</div>;
  if (!classData) return <div className="loading-state">Class not found.</div>;

  // Capacity calculations
  const capacity = classData.capacity || 40;
  const enrolledCount = students.length;
  const utilizationPercentage = Math.min(100, Math.round((enrolledCount / capacity) * 100));

  // Initials generator for premium logo avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Student list search filtering
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.admission_no && s.admission_no.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      {/* 1. Header Hero Area */}
      <div className="hero-header-card">
        <div className="hero-left">
          <div className="class-avatar-badge">
            {getInitials(classData.name)}
          </div>
          <div className="class-meta-info">
            <h1>{classData.name}</h1>
            <div className="badge-row">
              {classData.level && <span className="pill-badge level-badge">Level: {classData.level}</span>}
              {classData.section && <span className="pill-badge section-badge">Section: {classData.section}</span>}
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <Link href={`/classes/${id}/edit`} className="action-btn btn-secondary">✏️ Edit</Link>
          <Link href={`/classes/${id}/enrollment`} className="action-btn btn-secondary">👥 Manage Students</Link>
          <Link href={`/classes/${id}/curriculum`} className="action-btn btn-secondary">📚 Manage Curriculum</Link>
          <button className="action-btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Analytic Cards */}
      <div className="analytics-metrics-row">
        <div className="metric-card">
          <div className="icon-wrapper students-icon">👥</div>
          <div className="metric-details">
            <span className="metric-label">Enrolled Students</span>
            <span className="metric-value">{enrolledCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon-wrapper subjects-icon">📚</div>
          <div className="metric-details">
            <span className="metric-label">Curriculum Subjects</span>
            <span className="metric-value">{subjects.length}</span>
          </div>
        </div>

        <div className="metric-card utilization-card">
          <div className="utilization-header">
            <span className="metric-label">Capacity Utilization</span>
            <span className="utilization-percentage">{utilizationPercentage}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${utilizationPercentage}%` }} />
          </div>
          <div className="utilization-footer">
            <span>{enrolledCount} of {capacity} seats occupied</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="dashboard-tabs-bar">
        {[
          { id: "overview", label: "📋 Overview" },
          { id: "students", label: `👥 Students (${enrolledCount})` },
          { id: "subjects", label: `📚 Subjects (${subjects.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? "active-tab" : ""}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content Area */}
      <div className="tab-viewport">
        {/* A. Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-pane fade-in-up">
            <div className="content-grid-half">
              {/* Form Teacher Details */}
              <div className="details-card">
                <h3>👨‍🏫 Class Form Teacher</h3>
                {classData.teacher_name ? (
                  <div className="teacher-profile-box">
                    <div className="teacher-icon-bubble">
                      {getInitials(classData.teacher_name)}
                    </div>
                    <div className="teacher-text">
                      <div className="teacher-name">{classData.teacher_name}</div>
                      <div className="teacher-email">{classData.teacher_email || "No email provided"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-teacher-state">
                    <span>⚠️ No form teacher assigned to this class yet.</span>
                  </div>
                )}
              </div>

              {/* Administrative Info */}
              <div className="details-card">
                <h3>📋 Administrative Metadata</h3>
                <div className="meta-list">
                  <div className="meta-item">
                    <span className="meta-label">Class Name</span>
                    <span className="meta-val">{classData.name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Class Section</span>
                    <span className="meta-val">{classData.section || "—"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Class Level</span>
                    <span className="meta-val">{classData.level || "—"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Creation Date</span>
                    <span className="meta-val">
                      {classData.created_at ? new Date(classData.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B. Students Tab */}
        {activeTab === "students" && (
          <div className="students-pane fade-in-up">
            <div className="search-filter-row">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search students by name or admission number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty-tab-state">
                <span className="empty-icon">👥</span>
                <p>No matching students found in this class.</p>
              </div>
            ) : (
              <div className="students-grid-cards">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="student-profile-card">
                    <div className="student-bubble-avatar">
                      {getInitials(student.name)}
                    </div>
                    <div className="student-card-details">
                      <div className="student-name-text">{student.name}</div>
                      <div className="student-admission-text">{student.admission_no || "No Admission Number"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* C. Subjects Tab */}
        {activeTab === "subjects" && (
          <div className="subjects-pane fade-in-up">
            {subjects.length === 0 ? (
              <div className="empty-tab-state">
                <span className="empty-icon">📚</span>
                <p>No curriculum subjects assigned to this class.</p>
                <Link href={`/classes/${id}/curriculum`} className="btn-primary" style={{ marginTop: "1rem" }}>
                  Add Subject to Curriculum
                </Link>
              </div>
            ) : (
              <div className="subjects-list-grid">
                {subjects.map((sub) => (
                  <div key={sub.id} className="subject-item-card">
                    <div className="subject-main-line">
                      <div className="subject-name-tag">{sub.name}</div>
                      <span className={`badge-type ${sub.is_compulsory ? "compulsory-pill" : "elective-pill"}`}>
                        {sub.is_compulsory ? "Required" : "Elective"}
                      </span>
                    </div>
                    <div className="subject-details-line">
                      {sub.code && <div className="subject-code-tag">Code: <span>{sub.code}</span></div>}
                      <div className="subject-teacher-tag">Taught by: <strong>{sub.teacher_names || "No Teacher Assigned"}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          color: #1e293b;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          font-size: 1.5rem;
          font-weight: 600;
          color: #64748b;
        }

        /* 1. Hero Card */
        .hero-header-card {
          background: linear-gradient(135deg, hsla(252, 78%, 60%, 1) 0%, hsla(243, 75%, 59%, 1) 100%);
          border-radius: 24px;
          padding: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
          color: white;
          box-shadow: 0 15px 35px -5px rgba(99, 102, 241, 0.25);
          margin-bottom: 2.5rem;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .class-avatar-badge {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -1px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .class-meta-info h1 {
          font-size: 2.8rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .badge-row {
          display: flex;
          gap: 0.8rem;
        }

        .pill-badge {
          padding: 0.4rem 1rem;
          border-radius: 99px;
          font-size: 1.1rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .level-badge {
          background: rgba(255, 255, 255, 0.25);
        }

        .section-badge {
          background: rgba(255, 255, 255, 0.15);
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.8rem 1.6rem;
          border-radius: 12px;
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* 2. Analytics Row */
        .analytics-metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .metric-card {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-4px);
        }

        .icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
        }

        .students-icon {
          background: #eef2ff;
        }

        .subjects-icon {
          background: #ecfdf5;
        }

        .metric-details {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 1.2rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 2.4rem;
          font-weight: 800;
          color: var(--text-main);
          margin-top: 0.2rem;
        }

        .utilization-card {
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
          gap: 0.8rem;
        }

        .utilization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .utilization-percentage {
          font-size: 1.8rem;
          font-weight: 800;
          color: #6366f1;
        }

        .progress-bar-bg {
          height: 10px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #4f46e5);
          border-radius: 99px;
          transition: width 0.4s ease-out;
        }

        .utilization-footer {
          font-size: 1.1rem;
          font-weight: 600;
          color: #64748b;
          text-align: right;
        }

        /* 3. Tab Navigation */
        .dashboard-tabs-bar {
          display: flex;
          gap: 0.8rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 2rem;
          padding-bottom: 0.5rem;
        }

        .tab-item {
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: 700;
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab-item:hover {
          color: #4f46e5;
        }

        .active-tab {
          color: #4f46e5;
        }

        .active-tab::after {
          content: "";
          position: absolute;
          bottom: -0.7rem;
          left: 0;
          right: 0;
          height: 3px;
          background: #4f46e5;
          border-radius: 99px;
        }

        /* 4. Tab Viewport Animations */
        .tab-viewport {
          min-height: 250px;
        }

        .fade-in-up {
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Overview Tab Layout */
        .content-grid-half {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .details-card {
          background: var(--bg-card);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }

        .details-card h3 {
          margin: 0 0 1.8rem 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .teacher-profile-box {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .teacher-icon-bubble {
          width: 56px;
          height: 56px;
          background: #eef2ff;
          color: #6366f1;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }

        .teacher-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .teacher-email {
          font-size: 1.2rem;
          color: #64748b;
          margin-top: 0.2rem;
        }

        .empty-teacher-state {
          padding: 2rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px dashed #cbd5e1;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .meta-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .meta-label {
          font-size: 1.2rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .meta-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: #334155;
        }

        /* Students Tab Layout */
        .search-filter-row {
          margin-bottom: 2rem;
        }

        .search-input {
          width: 100%;
          padding: 1.2rem 1.8rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          font-size: 1.3rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .students-grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .student-profile-card {
          background: var(--bg-card);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .student-profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03);
          border-color: #cbd5e1;
        }

        .student-bubble-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f5f3ff;
          color: #8b5cf6;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .student-name-text {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .student-admission-text {
          font-size: 1.1rem;
          color: #94a3b8;
          margin-top: 0.1rem;
        }

        /* Subjects Tab Layout */
        .subjects-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .subject-item-card {
          background: var(--bg-card);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 1.8rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        .subject-item-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }

        .subject-main-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .subject-name-tag {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .badge-type {
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .compulsory-pill {
          background: #dbeafe;
          color: #1e40af;
        }

        .elective-pill {
          background: #fef3c7;
          color: #92400e;
        }

        .subject-details-line {
          font-size: 1.2rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .subject-code-tag span {
          font-family: monospace;
          background: #f1f5f9;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          color: #334155;
        }

        .subject-teacher-tag strong {
          color: #334155;
        }

        .empty-tab-state {
          padding: 4rem 2rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
          border-radius: 20px;
          border: 2px dashed #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .empty-icon {
          font-size: 3rem;
        }

        .empty-tab-state p {
          font-size: 1.4rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
