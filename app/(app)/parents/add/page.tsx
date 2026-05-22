"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

export default function AddParentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast.error("First name, last name, and email are required");
    }
    setSubmitting(true);
    try {
      let avatar: string | null = null;
      if (avatarFile) {
        const reader = new FileReader();
        avatar = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(avatarFile);
        });
      }

      const fullName = `${form.firstName} ${form.lastName}`;
      const res = await authenticatedFetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: form.email,
          phone: form.phone,
          avatar: avatar || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(
        `Parent added! Default password: ${data.data?.defaultPassword ?? "EduCore@YYYY"}`,
        { duration: 8000 }
      );
      router.push("/parents");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add parent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/parents" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Parents
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Add New Parent</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Register a new parent. A default password will be generated automatically.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Parent Photo</div>
          <div style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>Parent Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              {avatarFile && (
                <div style={{ marginTop: "0.8rem" }}>
                  <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                    Image selected
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-section-title">Personal Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Chioma" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="e.g. Okonkwo" required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="parent@email.com" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/parents" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding Parent…" : "Add Parent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
