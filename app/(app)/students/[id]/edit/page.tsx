"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface StudentData {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  parent_phone?: string;
  dob?: string;
  gender?: string;
  class_id?: string;
  address?: string;
  state_of_origin?: string;
  avatar?: string;
  parent_id?: string;
  admission_no?: string;
}

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", dob: "", gender: "",
    classId: "", parentId: "", address: "", stateOfOrigin: "", avatar: "", parentPhone: "",
    admissionNo: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      authenticatedFetch(`/api/students/${id}`).then((r) => r.json()),
      authenticatedFetch("/api/classes").then((r) => r.json()),
      authenticatedFetch("/api/parents").then((r) => r.json()),
    ]).then(([sd, cd, pd]) => {
      const s = sd.data as StudentData;
      if (s) {
        const [first, ...rest] = (s.name ?? "").split(" ");
        setForm({
          firstName: s.first_name ?? first ?? "",
          lastName: s.last_name ?? rest.join(" ") ?? "",
          email: s.email ?? "",
          admissionNo: s.admission_no ?? "",
          phone: s.phone ?? "",
          parentPhone: s.parent_phone ?? "",
          dob: s.dob ? s.dob.slice(0, 10) : "",
          gender: s.gender ?? "",
          classId: s.class_id ?? "",
          parentId: s.parent_id ?? "",
          address: s.address ?? "",
          stateOfOrigin: s.state_of_origin ?? "",
          avatar: s.avatar ?? "",
        });
      }
      setClasses(Array.isArray(cd.data) ? cd.data : []);
      setParents(Array.isArray(pd.data) ? pd.data : []);
    }).catch(() => toast.error("Failed to load student"))
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

      const res = await authenticatedFetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          admissionNo: form.admissionNo || null,
          phone: form.phone || null,
          parentPhone: form.parentPhone || null,
          dob: form.dob || null,
          gender: form.gender === "" ? "" : form.gender,
          classId: form.classId || null,
          parentId: form.parentId || null,
          address: form.address || null,
          stateOfOrigin: form.stateOfOrigin || null,
          avatar: avatar || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Student updated");
      router.push(`/students/${id}`);
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
          <h1>Edit Student</h1>
          <p>Update student information.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "2rem", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label>Student Photo</label>
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
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={form.classId} onChange={(e) => set("classId", e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Link Parent/Guardian</label>
              <select value={form.parentId} onChange={(e) => set("parentId", e.target.value)}>
                <option value="">Select Parent</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Parent/Guardian Phone</label>
              <input type="tel" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>State of Origin</label>
              <input value={form.stateOfOrigin} onChange={(e) => set("stateOfOrigin", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} />
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
