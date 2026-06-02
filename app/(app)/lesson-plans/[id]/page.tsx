"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface LessonPlan {
  id: string; title: string; topic?: string; status: string;
  class_name?: string; subject_name?: string; teacher_name?: string;
  week?: number; term?: string; duration?: number;
  objectives?: string; activities?: string; resources?: string;
  assessment?: string; is_ai_generated?: number; created_at: string;
}

const STATUS_ACTIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: ["pending"],
};

export default function LessonPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authenticatedFetch(`/api/lesson-plans/${id}`)
      .then((r) => r.json())
      .then((d) => setPlan(d.data ?? null))
      .catch(() => toast.error("Failed to load lesson plan"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await authenticatedFetch(`/api/lesson-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setPlan((p) => p ? { ...p, status: newStatus } : p);
      toast.success(`Plan ${newStatus}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this lesson plan?")) return;
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/lesson-plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Lesson plan deleted");
      router.push("/lesson-plans");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!plan) return <div className="table-empty">Lesson plan not found.</div>;

  const statusBadge = plan.status === "approved" ? "badge-green" : plan.status === "rejected" ? "badge-red" : "badge-yellow";
  const nextActions = STATUS_ACTIONS[plan.status] ?? [];

  const sections = [
    { label: "Learning Objectives", content: plan.objectives },
    { label: "Activities / Procedure", content: plan.activities },
    { label: "Resources / Materials", content: plan.resources },
    { label: "Assessment / Evaluation", content: plan.assessment },
  ].filter((s) => s.content);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{plan.title}</h1>
          <p>
            {plan.subject_name && <span>{plan.subject_name} · </span>}
            {plan.class_name && <span>{plan.class_name} · </span>}
            {plan.week && <span>Week {plan.week} · </span>}
            {plan.duration && <span>{plan.duration} min</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.back()}>← Back</button>
          {nextActions.map((action) => (
            <button
              key={action}
              className="btn-primary"
              onClick={() => handleStatus(action)}
              disabled={updating}
              style={{ background: action === "approved" ? "#22c55e" : action === "rejected" ? "#ef4444" : undefined }}
            >
              {updating ? "…" : action.charAt(0).toUpperCase() + action.slice(1)}
            </button>
          ))}
          <button className="btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: "#ef4444" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "2rem 3rem", marginBottom: "2.5rem", display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
        <span className={`badge ${statusBadge}`} style={{ fontSize: "1.3rem", padding: "0.5rem 1.4rem" }}>{plan.status}</span>
        {plan.is_ai_generated === 1 && <span className="badge badge-blue" style={{ fontSize: "1.3rem" }}>✨ AI Generated</span>}
        {plan.teacher_name && <span style={{ fontSize: "1.4rem", color: "#64748b" }}>By {plan.teacher_name}</span>}
        {plan.term && <span style={{ fontSize: "1.4rem", color: "#64748b" }}>{plan.term}</span>}
        <span style={{ fontSize: "1.3rem", color: "#94a3b8" }}>Created {new Date(plan.created_at).toLocaleDateString("en-NG")}</span>
      </div>

      {plan.topic && (
        <div style={{ background: "#f8f7ff", border: "1px solid #ede9fa", borderRadius: 12, padding: "1.5rem 2.5rem", marginBottom: "2rem", fontSize: "1.5rem", fontWeight: 600, color: "#6A5ACD" }}>
          Topic: {plan.topic}
        </div>
      )}

      {sections.map((s) => (
        <div key={s.label} className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-section-title">{s.label}</div>
          <div style={{ fontSize: "1.5rem", color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {s.content}
          </div>
        </div>
      ))}
    </div>
  );
}
