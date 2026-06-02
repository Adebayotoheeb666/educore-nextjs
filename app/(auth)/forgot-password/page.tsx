"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Something went wrong");
        return;
      }
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <header className="auth-header">
        <Link href="/" className="auth-logo">EduCore AI</Link>
        <Link href="/contact-us" className="auth-header-link">Support</Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div
            style={{
              width: 56,
              height: 56,
              background: "#f3f0ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2.5rem",
              fontSize: "2.2rem",
            }}
          >
            🔄
          </div>
          <h1>Forgot Password</h1>
          <p className="subtitle">Enter your email to receive a password reset link.</p>

          {sent ? (
            <div
              className="auth-insight"
              style={{ borderColor: "#22c55e", backgroundColor: "#f0fdf4", marginBottom: "2rem" }}
            >
              <span className="auth-insight-icon">✅</span>
              <div className="auth-insight-text">
                <h5 style={{ color: "#15803d" }}>EMAIL SENT</h5>
                <p style={{ color: "#15803d" }}>
                  A password reset link has been sent to <strong>{email}</strong>. Check your inbox and spam folder.
                </p>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@school.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="btn-auth" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link →"}
              </button>
            </form>
          )}

          <Link href="/login" className="back-to-login">
            <span>←</span> Back to Login
          </Link>

          <div
            className="auth-insight"
            style={{ borderColor: "#6A5ACD", backgroundColor: "#f3f0ff" }}
          >
            <span className="auth-insight-icon">✨</span>
            <div className="auth-insight-text">
              <h5 style={{ color: "#6A5ACD" }}>EduCore Tip</h5>
              <p style={{ color: "#6A5ACD" }}>
                Check your institutional inbox and the spam folder if the link doesn&apos;t arrive within
                2 minutes.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <p>© {new Date().getFullYear()} EduCore AI. Empowering Nigerian Education.</p>
        <div className="auth-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/contact-us">Contact Support</Link>
        </div>
      </footer>
    </div>
  );
}
