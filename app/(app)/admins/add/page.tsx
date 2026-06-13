"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

const ADMIN_ROLES = [
  { value: "principal", label: "Principal" },
  { value: "vp_academics", label: "VP Academics" },
  { value: "vp_admin", label: "VP Admin" },
  { value: "admin_staff", label: "Admin Staff" },
  { value: "bursar", label: "Bursar" },
  { value: "librarian", label: "Librarian" },
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  principal: "Can manage the whole school system: add staff, students, parents, classes, exams, fees, and view analytics.",
  vp_academics: "Can oversee academic programmes, lesson plans, subject assignments, exam creation, and approve teacher workflows.",
  vp_admin: "Can manage administrative operations, announcements, attendance, behaviour records, and school-wide policies.",
  admin_staff: "Can support school operations by managing users, attendance, reporting, and day-to-day admin workflows.",
  bursar: "Can manage fees, collections, payment records, defaulters, and all finance-related school activities.",
  librarian: "Can manage the library module, book checkouts, returns, overdue notices, and library inventory.",
};

export default function AddAdminPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "principal",
  });

  useEffect(() => {
    if (user && user.role !== "school_owner") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast.error("First name, last name, and email are required");
    }

    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add admin");

      toast.success(
        `Admin added successfully. Default password: ${data.data?.defaultPassword || `EduCore@${new Date().getFullYear()}`}`,
        { duration: 7000 }
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link
          href="/dashboard"
          style={{
            textDecoration: "none",
            color: "#64748b",
            fontSize: "1.4rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          Add School Admin
        </h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Create a new school admin account for leadership and operations roles.
          The account will be active immediately and use a default password.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Admin Details</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="e.g. Amina"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="e.g. Okoye"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="admin@school.ng"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>
            Role
          </div>
          <div className="form-group">
            <label>Admin Role *</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8fafc", border: "1px solid #c7d2fe", borderRadius: 8 }}>
            <p style={{ margin: 0, color: "#1e293b", fontSize: "1rem", lineHeight: 1.6 }}>
              <strong>{ADMIN_ROLES.find((role) => role.value === form.role)?.label} permissions:</strong> {ROLE_DESCRIPTIONS[form.role]}
            </p>
          </div>

          <div style={{ marginTop: "1rem", color: "#475569", fontSize: "1.05rem" }}>
            <p style={{ margin: 0 }}>
              Default password will be set automatically to <strong>EduCore@{new Date().getFullYear()}</strong>.
              The user can later update their password.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/dashboard" className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding admin…" : "Add Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
