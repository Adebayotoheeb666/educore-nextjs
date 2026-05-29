"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import "../shared.css";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>((user as Record<string, unknown>)?.avatar as string ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: (user as Record<string, unknown>)?.name as string ?? "",
    email: user?.email ?? "",
    phone: (user as Record<string, unknown>)?.phone as string ?? "",
  });
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));
  const setPw = (field: string, value: string) => setPasswords((p) => ({ ...p, [field]: value }));

  const displayName =
    (user as Record<string, unknown>)?.name as string
    ?? `${(user as Record<string, unknown>)?.firstName ?? ""} ${(user as Record<string, unknown>)?.lastName ?? ""}`.trim()
    ?? "User";

  const avatarSrc = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6A5ACD&color=fff&size=80`;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "educore/avatars");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const url = data.data.url as string;
      setAvatarUrl(url);
      // Persist to profile
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar: url }),
      });
      dispatch(setUser({ ...user!, avatar: url }));
      toast.success("Avatar updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      dispatch(setUser({ ...user!, ...data.data }));
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) return toast.error("Passwords do not match");
    if (passwords.newPw.length < 8) return toast.error("Password must be at least 8 characters");
    setChangingPw(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Password changed successfully");
      setPasswords({ current: "", newPw: "", confirm: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Profile</h1>
          <p>Update your personal information and password.</p>
        </div>
      </div>

      {/* Hero with avatar upload */}
      <div className="profile-hero-card">
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "3px solid #ede9fa" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            title="Change avatar"
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: "50%",
              background: "#6A5ACD", color: "white", border: "2px solid white",
              fontSize: "1.2rem", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            {uploadingAvatar ? "…" : "✎"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <div style={{ minWidth: 0, width: "100%" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw + 1rem, 2.4rem)", fontWeight: 800, margin: 0, wordBreak: "break-word" }}>{displayName}</h2>
          <p style={{ color: "#64748b", margin: "0.4rem 0 0", fontSize: "clamp(1.1rem, 2vw + 0.5rem, 1.4rem)" }}>
            {user?.role?.replace(/_/g, " ").toUpperCase() ?? "USER"}
          </p>
          <p style={{ color: "#94a3b8", margin: "0.2rem 0 0", fontSize: "clamp(1rem, 1.5vw + 0.4rem, 1.2rem)" }}>
            Click the pencil icon to update your photo
          </p>
        </div>
      </div>

      <div className="profile-forms-grid">
        {/* Profile form */}
        <div className="form-card">
          <div className="form-section-title">Personal Information</div>
          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.ng" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password form */}
        <div className="form-card">
          <div className="form-section-title">Change Password</div>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={passwords.current} onChange={(e) => setPw("current", e.target.value)} placeholder="Current password" autoComplete="current-password" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={passwords.newPw} onChange={(e) => setPw("newPw", e.target.value)} placeholder="Min. 8 characters" minLength={8} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPw("confirm", e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-primary" disabled={changingPw}>
              {changingPw ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
