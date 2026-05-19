"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import "../shared.css";

interface SchoolStats {
  classes: number;
  teachers: number;
  students: number;
  subjects: number;
  activeServices: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  icon: string;
}

export default function ProfileSetupPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: (user as Record<string, unknown>)?.first_name as string ?? "",
    lastName: (user as Record<string, unknown>)?.last_name as string ?? "",
    phone: (user as Record<string, unknown>)?.phone as string ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(
    (user as Record<string, unknown>)?.avatar as string ?? ""
  );
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [showPwForm, setShowPwForm] = useState(false);

  const displayName =
    ((user as Record<string, unknown>)?.name as string) ||
    `${form.firstName} ${form.lastName}`.trim() ||
    "Admin";

  const avatarSrc =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6A5ACD&color=fff&size=80&bold=true`;

  useEffect(() => {
    fetch("/api/school/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => null);
  }, []);

  const checklist: ChecklistItem[] = [
    {
      id: "school-info",
      label: "Complete school profile",
      description: "Add your school address, contact email, type, and logo.",
      href: "/school/settings",
      icon: "🏫",
      done: false, // can't easily detect without extra fetch; user can mark manually via navigation
    },
    {
      id: "services",
      label: "Choose your services",
      description: "Activate the modules your school needs — attendance, fees, exams, and more.",
      href: "/school/services",
      icon: "🔧",
      done: (stats?.activeServices ?? 0) > 0,
    },
    {
      id: "classes",
      label: "Create classes",
      description: "Set up your class structure, e.g. JSS 1A, SS 2B.",
      href: "/classes/add",
      icon: "🏛️",
      done: (stats?.classes ?? 0) > 0,
    },
    {
      id: "subjects",
      label: "Add subjects",
      description: "Define subjects and assign them to classes.",
      href: "/subjects",
      icon: "📚",
      done: (stats?.subjects ?? 0) > 0,
    },
    {
      id: "teachers",
      label: "Add teachers",
      description: "Invite or create staff accounts for your teachers.",
      href: "/teachers/add",
      icon: "👩‍🏫",
      done: (stats?.teachers ?? 0) > 0,
    },
    {
      id: "students",
      label: "Enrol students",
      description: "Add student records individually or via bulk import.",
      href: "/students/add",
      icon: "👨‍🎓",
      done: (stats?.students ?? 0) > 0,
    },
  ];

  const completed = checklist.filter((c) => c.done).length;
  const progress = Math.round((completed / checklist.length) * 100);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
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
      toast.success("Profile saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) return toast.error("Passwords do not match");
    if (passwords.newPw.length < 8) return toast.error("New password must be at least 8 characters");
    setChangingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Password changed successfully");
      setPasswords({ current: "", newPw: "", confirm: "" });
      setShowPwForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div style={{ padding: "3rem", maxWidth: 960, margin: "0 auto" }}>
      <div className="page-header-row" style={{ marginBottom: "3rem" }}>
        <div className="page-header-text">
          <h1>My Profile</h1>
          <p>Manage your personal details and track your school setup progress.</p>
        </div>
        <Link href="/profile" style={{ color: "#6A5ACD", fontSize: "1.3rem", fontWeight: 600 }}>
          View full profile →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start" }}>
        {/* Left column: personal info */}
        <div>
          {/* Avatar */}
          <div className="form-card" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2.5rem" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#6A5ACD", border: "2px solid #fff",
                    color: "#fff", fontSize: "1rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  title="Change photo"
                >
                  ✏️
                </button>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "1.5rem", margin: "0 0 0.3rem" }}>{displayName}</p>
                <p style={{ color: "#64748b", fontSize: "1.3rem", margin: 0 }}>
                  {user?.role?.replace(/_/g, " ").toUpperCase()}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "1.2rem", margin: "0.2rem 0 0" }}>{user?.email}</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

            <form onSubmit={handleSaveProfile}>
              <div className="form-grid-2" style={{ marginBottom: "2rem" }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Okonkwo"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "2rem" }}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+234 801 234 5678"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ width: "100%" }}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="form-card">
            <h2 className="form-section-title" style={{ marginBottom: "1.5rem" }}>Security</h2>
            {!showPwForm ? (
              <button
                type="button"
                onClick={() => setShowPwForm(true)}
                className="btn-secondary"
                style={{ width: "100%" }}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwords.newPw}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                    minLength={8}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="button" onClick={() => setShowPwForm(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={changingPw} style={{ flex: 1 }}>
                    {changingPw ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right column: setup checklist */}
        <div className="form-card" style={{ alignSelf: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.4rem" }}>School Setup</h2>
              <p style={{ color: "#64748b", fontSize: "1.3rem", margin: 0 }}>
                {completed} of {checklist.length} steps complete
              </p>
            </div>
            <span style={{
              fontSize: "1.8rem", fontWeight: 800,
              color: progress === 100 ? "#16a34a" : "#6A5ACD",
            }}>
              {progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: "2.5rem", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: progress === 100 ? "#16a34a" : "#6A5ACD",
              borderRadius: 4,
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* Checklist items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {checklist.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.2rem",
                  padding: "1.2rem",
                  borderRadius: 10,
                  border: `1.5px solid ${item.done ? "#bbf7d0" : "#e2e8f0"}`,
                  background: item.done ? "#f0fdf4" : "#fff",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                {/* Status icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: item.done ? "#16a34a" : "#f1f5f9",
                  color: item.done ? "#fff" : "#94a3b8",
                  fontSize: "1.3rem", fontWeight: 700,
                }}>
                  {item.done ? "✓" : item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: "0 0 0.3rem",
                    fontWeight: 700,
                    fontSize: "1.35rem",
                    color: item.done ? "#15803d" : "#1e293b",
                    textDecoration: item.done ? "line-through" : "none",
                    opacity: item.done ? 0.7 : 1,
                  }}>
                    {item.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "1.2rem", color: "#64748b", lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
                {!item.done && (
                  <span style={{ color: "#6A5ACD", fontSize: "1.6rem", flexShrink: 0, alignSelf: "center" }}>→</span>
                )}
              </Link>
            ))}
          </div>

          {progress === 100 && (
            <div style={{ marginTop: "2rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🎉</p>
              <p style={{ fontWeight: 700, color: "#166534", margin: "0 0 0.3rem", fontSize: "1.4rem" }}>
                School fully set up!
              </p>
              <p style={{ color: "#15803d", margin: 0, fontSize: "1.2rem" }}>
                Your school is ready to use all activated services.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
