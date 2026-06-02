"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

const ROLES = ["all", "admin", "class_teacher", "subject_teacher", "parent", "student"];

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    targetRoles: ["all"] as string[],
    classId: "",
    expiresAt: "",
    isPinned: false,
  });

  useEffect(() => {
    authenticatedFetch("/api/classes")
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const toggleRole = (role: string) => {
    if (role === "all") {
      setForm((p) => ({ ...p, targetRoles: ["all"] }));
      return;
    }
    setForm((p) => {
      const without = p.targetRoles.filter((r) => r !== "all" && r !== role);
      const has = p.targetRoles.includes(role);
      return { ...p, targetRoles: has ? without : [...without, role] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error("Title and content are required");
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          target_roles: form.targetRoles.join(","),
          class_id: form.classId || null,
          expires_at: form.expiresAt || null,
          is_pinned: form.isPinned ? 1 : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Announcement published");
      router.push("/announcements");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>New Announcement</h1>
          <p>Publish a notice to staff, parents, or students.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-term holiday schedule" required />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              placeholder="Write the full announcement…"
              required
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label>Target Audience</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.8rem" }}>
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  style={{
                    padding: "0.6rem 1.4rem",
                    borderRadius: 8,
                    border: "1px solid",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: form.targetRoles.includes(role) ? "#6A5ACD" : "white",
                    color: form.targetRoles.includes(role) ? "white" : "#475569",
                    borderColor: form.targetRoles.includes(role) ? "#6A5ACD" : "#e2e8f0",
                  }}
                >
                  {role.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Target Class (optional)</label>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Expires At (optional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>

          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <input
              type="checkbox"
              id="pin"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              style={{ width: "auto", accentColor: "#6A5ACD" }}
            />
            <label htmlFor="pin" style={{ margin: 0, cursor: "pointer" }}>Pin this announcement to the top</label>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Publishing…" : "Publish Announcement"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
