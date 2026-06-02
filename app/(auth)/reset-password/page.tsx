"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../auth.css";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) toast.error("Missing reset token");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Invalid reset link");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>✅</div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem" }}>Password Reset!</h2>
          <p style={{ fontSize: "1.5rem", color: "#64748b" }}>Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-header">
        <div className="auth-logo">Edu<span>core</span></div>
        <p className="auth-tagline">Set your new password</p>
      </div>

      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {!token ? (
          <p style={{ color: "#ef4444", fontSize: "1.4rem" }}>
            This link is invalid or has already been used. Please{" "}
            <a href="/forgot-password" style={{ color: "#6A5ACD" }}>request a new one</a>.
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            <div className="auth-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
