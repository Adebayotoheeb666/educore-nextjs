"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "../../shared.css";

interface Post {
  id: string; title: string; slug: string; status?: string;
  author_name?: string; published_at?: string; created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", status: "draft" });

  const load = () => {
    setLoading(true);
    fetch("/api/blog", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load posts"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error("Title and content are required");
    setSubmitting(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Post created");
      setForm({ title: "", content: "", excerpt: "", status: "draft" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Blog Posts</h1>
          <p>Manage platform-wide blog content.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "✏️ New Post"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: "3rem" }}>
          <div className="form-section-title">New Blog Post</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" required />
            </div>
            <div className="form-group">
              <label>Excerpt</label>
              <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary (optional)" />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Write your post content…" required style={{ resize: "vertical" }} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Post"}
            </button>
          </form>
        </div>
      )}

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="table-empty">No blog posts yet.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.title}</td>
                  <td>{p.author_name ?? "—"}</td>
                  <td>
                    <span className={`badge ${p.status === "published" ? "badge-green" : "badge-gray"}`}>
                      {p.status ?? "draft"}
                    </span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString("en-NG")}</td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn danger" onClick={() => handleDelete(p.id, p.title)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
