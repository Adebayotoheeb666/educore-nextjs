"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Parent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export default function EditParentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    authenticatedFetch(`/api/parents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.data;
        if (p) {
          const [first, ...rest] = (p.name ?? "").split(" ");
          setForm({
            firstName: first ?? "",
            lastName: rest.join(" ") ?? "",
            email: p.email ?? "",
            phone: p.phone ?? "",
            avatar: p.avatar ?? "",
          });
        }
      })
      .catch(() => toast.error("Failed to load parent"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatar = form.avatar;
      if (avatarFile) {
        const reader = new FileReader();
        avatar = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(avatarFile);
        });
      }

      const res = await authenticatedFetch(`/api/parents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone || null,
          avatar: avatar || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Parent updated");
      router.push(`/parents/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Edit Parent</h1>
          <p>Update parent information.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "2rem", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label>Parent Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                {(form.avatar || avatarFile) && (
                  <div style={{ marginTop: "0.8rem" }}>
                    {avatarFile || form.avatar ? (
                      <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                        <img
                          src={avatarFile ? URL.createObjectURL(avatarFile) : form.avatar}
                          alt="preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ) : null}
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                      {avatarFile ? "New image selected" : "Current image"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
