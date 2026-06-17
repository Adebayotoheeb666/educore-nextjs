"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../auth.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      return toast.error("Please fill in all fields");
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.identifier.trim(), password: formData.password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Login failed");
        return;
      }
      const userData = data.data ?? data;
      dispatch(setUser(userData));
      toast.success("Welcome back!");
      const role = userData.role;
      if (role === "super_admin") router.push("/admin");
      else if (role === "student") router.push("/student/dashboard");
      else if (role === "parent") router.push("/parent/dashboard");
      else router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
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
          <h1>Welcome Back</h1>
          <p className="subtitle">Access your administrative dashboard</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-group">
              <label htmlFor="identifier">Email, Phone, or Admission No.</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                placeholder="e.g. admin@school.ng, +234 801 234 5678, or SC-2026-0001"
                value={formData.identifier}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="auth-group">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
              </div>
              <div className="pass-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="auth-insight">
            <span className="auth-insight-icon">✨</span>
            <div className="auth-insight-text">
              <h5>AI INSIGHT</h5>
              <p>Securing your connection to the National Education Grid.</p>
            </div>
          </div>

          <div className="auth-bottom-text">
            New institution?{" "}
            <Link href="/register">Register your school</Link>
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
