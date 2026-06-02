"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface LessonPlan {
  id: string;
  title: string;
  class_name: string;
  subject_name?: string;
  status: string;
  created_at: string;
}

export default function TeacherLessonPlansPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    authenticatedFetch("/api/lesson-plans")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.data) ? data.data : [];
        setPlans(list);
      })
      .catch(() => toast.error("Failed to load lesson plans."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Lesson Plans</h1>
          <p>Review the latest lesson plan drafts, status updates, and subjects you are teaching.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/lesson-plans/create" className="btn-primary">
            + Create Plan
          </Link>
          <Link href="/lesson-plans/generate" className="btn-outline">
            Generate Plan
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="table-empty">Loading lesson plans…</div>
      ) : plans.length === 0 ? (
        <div className="table-empty">No lesson plans found. Create one to get started.</div>
      ) : (
        <div className="teacher-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <Link href={`/lesson-plans/${plan.id}`} className="link-primary">
                      {plan.title}
                    </Link>
                  </td>
                  <td>{plan.class_name}</td>
                  <td>{plan.status}</td>
                  <td>{new Date(plan.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
