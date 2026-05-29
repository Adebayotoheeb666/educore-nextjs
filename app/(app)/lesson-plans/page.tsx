"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface LessonPlan {
  id: string;
  title: string;
  topic?: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  status?: string;
  ai_generated?: number;
  week?: number;
  term?: string;
  created_at?: string;
}

const STATUS_CLASS: Record<string, string> = {
  pending: "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red",
};

export default function LessonPlansPage() {

  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/lesson-plans", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load lesson plans"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return plans.filter((p) => {
      const matchSearch =
        !q ||
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.topic ?? "").toLowerCase().includes(q) ||
        (p.subject_name ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || (p.status ?? "") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [plans, search, statusFilter]);

  const stats = {
    total: plans.length,
    approved: plans.filter((p) => p.status === "approved").length,
    pending: plans.filter((p) => p.status === "pending").length,
    aiGenerated: plans.filter((p) => p.ai_generated).length,
  };

  return (
    <ServiceGate slug="lesson-plans">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Lesson Planning</h1>
          <p>Collaborative curriculum design and AI-powered lesson generation.</p>
        </div>
        <div className="header-actions">
          <Link href="/lesson-plans/generate" className="btn-outline">✨ AI Lesson Studio</Link>
          <Link href="/lesson-plans/create" className="btn-primary">+ New Plan</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Total Plans",   value: stats.total,       icon: "📚" },
          { label: "Approved",      value: stats.approved,    icon: "✅" },
          { label: "Pending",       value: stats.pending,     icon: "⏳" },
          { label: "AI Assisted",   value: stats.aiGenerated, icon: "✨" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.8rem", marginBottom: "0.8rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, topic, or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading lesson plans…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            {plans.length === 0 ? "No lesson plans created yet." : "No plans match your filters."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title / Topic</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Term / Week</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="name-stack">
                      <h4>
                        {p.title}
                        {p.ai_generated ? <span style={{ marginLeft: "0.6rem", fontSize: "1rem", color: "#6A5ACD" }}>✨ AI</span> : null}
                      </h4>
                      {p.topic && <p>{p.topic}</p>}
                    </div>
                  </td>
                  <td>{p.subject_name ?? "—"}</td>
                  <td>{p.class_name ?? "—"}</td>
                  <td>{p.teacher_name ?? "—"}</td>
                  <td>{p.term ? `${p.term}${p.week ? `, Wk ${p.week}` : ""}` : "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[p.status ?? "pending"] ?? "badge-gray"}`}>
                      {p.status ?? "pending"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/lesson-plans/${p.id}`} className="link-action">View</Link>
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
