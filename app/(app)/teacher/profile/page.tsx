"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  is_active?: number;
  created_at?: string;
}

export default function TeacherProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    authenticatedFetch(`/api/teachers/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.data ?? null);
      })
      .catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Profile</h1>
          <p>Manage your personal information, contact details, and teacher profile data.</p>
        </div>
        <Link href="/profile" className="btn-primary">
          Edit profile
        </Link>
      </div>

      {loading ? (
        <div className="table-empty">Loading profile…</div>
      ) : !profile ? (
        <div className="table-empty">Profile not found.</div>
      ) : (
        <div className="form-card">
          <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "2rem" }}>{profile.name}</h2>
              <p style={{ margin: "0.5rem 0 0", color: "#64748b" }}>{profile.role ?? "Teacher"}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ margin: 0, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>Email</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "1.4rem" }}>{profile.email}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>Phone</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "1.4rem" }}>{profile.phone || "Not provided"}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>Status</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "1.4rem" }}>
                  {profile.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>Joined</p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "1.4rem" }}>
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
