"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../shared.css";

interface FeedbackItem {
  id: string;
  subject?: string;
  message: string;
  rating?: number;
  author_name?: string;
  author_role?: string;
  status?: string;
  created_at: string;
}

export default function FeedbackPage() {

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", rating: "5" });

  const load = () => {
    setLoading(true);
    fetch("/api/feedback", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load feedback"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message) return toast.error("Message is required");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Feedback submitted — thank you!");
      setForm({ subject: "", message: "", rating: "5" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (n?: number) => "★".repeat(n ?? 0) + "☆".repeat(5 - (n ?? 0));

  return (
    <ServiceGate slug="feedback">
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Feedback</h1>
          <p>Share and review feedback from staff and stakeholders.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "💬 Submit Feedback"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">Submit Feedback</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Timetable issue" />
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Describe your feedback…" required style={{ resize: "vertical" }} />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{stars(n)} ({n}/5)</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="table-empty">Loading feedback…</div>
      ) : items.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "5rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💬</div>
          <p style={{ fontSize: "1.6rem", fontWeight: 600 }}>No feedback submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {items.map((f) => (
            <div key={f.id} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  {f.subject && <h3 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>{f.subject}</h3>}
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "1.2rem", color: "#94a3b8" }}>
                    {f.author_name && <span>By {f.author_name}</span>}
                    {f.author_role && <span>({f.author_role.replace(/_/g, " ")})</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {f.rating && <div style={{ color: "#f59e0b", fontSize: "1.4rem" }}>{stars(f.rating)}</div>}
                  <div style={{ fontSize: "1.2rem", color: "#94a3b8", marginTop: "0.4rem" }}>
                    {new Date(f.created_at).toLocaleDateString("en-NG")}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "1.4rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
      </ServiceGate>
  );
}
