"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  status?: string;
  author?: { name?: string };
  publishedAt?: string | null;
  createdAt: string | null;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", coverImage: "", status: "draft" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = () => {
    setLoading(true);
    authenticatedFetch("/api/blog?status=all")
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d.blogPosts) ? d.blogPosts : []))
      .catch(() => toast.error("Failed to load posts"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm({ title: "", content: "", excerpt: "", coverImage: "", status: "draft" });
    setEditingPostId(null);
    setLocalImagePreview(null);
  };

  const startEdit = (post: Post) => {
    setForm({
      title: post.title || "",
      content: post.content || "",
      excerpt: post.excerpt || "",
      coverImage: post.coverImage || "",
      status: post.status || "draft",
    });
    setEditingPostId(post.id);
    setLocalImagePreview(post.coverImage || null);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
      setUploadingImage(true);
      const previewUrl = URL.createObjectURL(file);
      setLocalImagePreview(previewUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "educore/blog");

      const res = await authenticatedFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      const uploadedUrl = data?.data?.url;
      if (!uploadedUrl) throw new Error("Upload did not return an image URL");
      setForm((prev) => ({ ...prev, coverImage: uploadedUrl }));
      setLocalImagePreview(uploadedUrl);
      toast.success("Image uploaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleImageUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleImageUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error("Title and content are required");
    setSubmitting(true);
    try {
      const url = editingPostId ? `/api/blog/${editingPostId}` : "/api/blog";
      const method = editingPostId ? "PATCH" : "POST";
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(editingPostId ? "Post updated" : "Post created");
      resetForm();
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await authenticatedFetch(`/api/blog/${id}`, { method: "DELETE" });
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
          <div className="form-section-title">{editingPostId ? "Edit Blog Post" : "New Blog Post"}</div>
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
              <label>Cover image</label>
              <div
                className={`file-drop-zone ${dragActive ? "active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <p>{uploadingImage ? "Uploading image…" : "Drag and drop an image here, or click to choose a file."}</p>
                <small>Supported formats: JPG, PNG, GIF. Max 5MB.</small>
              </div>
              {localImagePreview || form.coverImage ? (
                <div className="image-preview-card">
                  <img src={localImagePreview || form.coverImage} alt="Cover preview" />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setForm({ ...form, coverImage: "" });
                      setLocalImagePreview(null);
                    }}
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
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
              {submitting ? (editingPostId ? "Saving…" : "Creating…") : editingPostId ? "Save Post" : "Create Post"}
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
                  <td>{p.author?.name ?? "—"}</td>
                  <td>
                    <span className={`badge ${p.status === "published" ? "badge-green" : "badge-gray"}`}>
                      {p.status ?? "draft"}
                    </span>
                  </td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-NG") : "—"}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/blog/${p.id}`} className="action-btn">
                        View
                      </Link>
                      <button type="button" className="action-btn" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="action-btn danger" onClick={() => handleDelete(p.id, p.title)}>
                        Delete
                      </button>
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
