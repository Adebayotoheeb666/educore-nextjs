"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface Exam {
  id: string;
  subject_name?: string;
  class_name?: string;
  class_section?: string;
  exam_type?: string;
  term?: string;
  date?: string;
  status?: string;
  total_marks?: number;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-gray",
  published: "badge-green",
  completed: "badge-blue",
};

export default function ExamsPage() {

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/exams", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setExams(Array.isArray(d.data) ? d.data : d.data?.exams ?? []))
      .catch(() => toast.error("Failed to load exams"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      const res = await fetch(`/api/exams/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setExams((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "published" } : e))
      );
      toast.success("Exam published");
    } catch {
      toast.error("Failed to publish exam");
    } finally {
      setPublishing(null);
    }
  };

  const scheduled = exams.length;
  const published = exams.filter((e) => e.status === "published").length;
  const draft = exams.filter((e) => e.status === "draft").length;

  return (
    <ServiceGate slug="exams">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Examination Management</h1>
          <p>Manage and schedule academic assessments.</p>
        </div>
        <div className="header-actions">
          <Link href="/exams/question-bank" className="btn-outline">📓 Question Bank</Link>
          <Link href="/exams/create" className="btn-primary">+ Create Exam</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Scheduled", value: scheduled, icon: "📅", color: "#1e40af", bg: "#eff6ff" },
          { label: "Published", value: published, icon: "✅", color: "#3730a3", bg: "#ede9fa" },
          { label: "Draft",     value: draft,     icon: "📝", color: "#475569", bg: "#f1f5f9" },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontWeight: 700, color: "#64748b", fontSize: "1.3rem" }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: "3.2rem", fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading exams…</div>
        ) : exams.length === 0 ? (
          <div className="table-empty">No exams scheduled yet.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Class</th>
                <th>Type</th>
                <th>Term</th>
                <th>Date</th>
                <th>Max Marks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex) => (
                <tr key={ex.id}>
                  <td style={{ fontWeight: 700 }}>{ex.subject_name ?? "—"}</td>
                  <td>
                    {ex.class_name
                      ? ex.class_section
                        ? `${ex.class_name} ${ex.class_section}`
                        : ex.class_name
                      : "—"}
                  </td>
                  <td>
                    <span className="badge badge-blue">{ex.exam_type ?? "—"}</span>
                  </td>
                  <td>{ex.term ?? "—"}</td>
                  <td>
                    {ex.date
                      ? new Date(ex.date).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>{ex.total_marks ?? "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[ex.status ?? "draft"] ?? "badge-gray"}`}>
                      {ex.status ?? "draft"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/exams/${ex.id}/scores`} className="link-action">Scores</Link>
                      {ex.status === "draft" && (
                        <button
                          className="btn-outline"
                          style={{ padding: "0.5rem 1.2rem", fontSize: "1.2rem" }}
                          disabled={publishing === ex.id}
                          onClick={() => handlePublish(ex.id)}
                        >
                          {publishing === ex.id ? "…" : "Publish"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
      </ServiceGate>
  );
}
