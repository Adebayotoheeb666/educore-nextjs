"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { OPTIONAL_SERVICES, type ServiceDefinition } from "@/config/services/catalog";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { formatPhoneDisplay } from "@/lib/utils/phoneClient";
import "../auth.css";

type Step = "details" | "services";

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  finance: "Finance",
  communication: "Communication",
  library: "Library",
  ai: "AI & Intelligence",
  analytics: "Analytics",
  mobile: "Mobile & Sync",
  backup: "Backup & Recovery",
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: "🎓",
  finance: "💰",
  communication: "📢",
  library: "📚",
  ai: "🤖",
  analytics: "📊",
  mobile: "📱",
  backup: "🛡️",
};

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    schoolName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (!formData.email && !formData.phoneNumber) {
      return toast.error("Please provide either an email address or a phone number");
    }
    setStep("services");
  };

  // Filter out admin-only services for signup
  const publicServices = OPTIONAL_SERVICES.filter((s) => !s.super_admin_only);

  function toggleService(slug: string, service: ServiceDefinition) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        // Removing: also remove any services that depend on this one
        const toRemove = new Set([slug]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const svc of publicServices) {
            if (!next.has(svc.slug)) continue;
            if (svc.dependencies.some((d) => toRemove.has(d))) {
              toRemove.add(svc.slug);
              changed = true;
            }
          }
        }
        toRemove.forEach((s) => next.delete(s));
      } else {
        // Adding: also add missing dependencies
        next.add(slug);
        for (const dep of service.dependencies) {
          const depSvc = publicServices.find((s) => s.slug === dep);
          if (depSvc) next.add(dep);
        }
      }
      return next;
    });
  }

  const monthlyTotal = Array.from(selectedServices).reduce((sum, slug) => {
    const svc = publicServices.find((s) => s.slug === slug);
    return sum + (svc?.base_price ?? 0);
  }, 0);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, selectedServices: Array.from(selectedServices) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Registration failed");
        setStep("details");
        return;
      }
      toast.success("School registered successfully! Continue your setup.");
      router.push("/onboarding");
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Group optional services by category
  const servicesByCategory = publicServices.reduce<Record<string, ServiceDefinition[]>>(
    (acc, svc) => {
      const cat = svc.category === "core" ? "academic" : svc.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(svc);
      return acc;
    },
    {}
  );

  return (
    <div className="auth-page-wrapper">
      <header className="auth-header">
        <Link href="/" className="auth-logo">EduCore AI</Link>
        <div style={{ display: "flex", gap: "2rem" }}>
          <Link href="/about-us" className="auth-header-link">About</Link>
          <Link href="#pricing" className="auth-header-link">Pricing</Link>
          <Link href="/contact-us" className="auth-header-link">Support</Link>
        </div>
      </header>

      <main className="auth-main">
        {step === "details" ? (
          <div className="auth-card" style={{ maxWidth: "600px" }}>
            <div className="mission-badge" style={{ marginBottom: "2rem", background: "#dbeafe", color: "#1e40af" }}>
              🎓 INSTITUTIONAL REGISTRATION
            </div>

            {/* Step indicator */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#6A5ACD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem" }}>1</span>
                <span style={{ fontWeight: 600, color: "#6A5ACD" }}>School Details</span>
              </div>
              <div style={{ flex: 1, height: 2, background: "#e2e8f0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.4 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#94a3b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem" }}>2</span>
                <span style={{ fontWeight: 600, color: "#64748b" }}>Choose Services</span>
              </div>
            </div>

            <h1>Join the Future of Learning</h1>
            <p className="subtitle">Equip your school with AI-powered administration and growth tools.</p>

            <form className="auth-form" onSubmit={handleDetailsNext}>
              <div className="form-row">
                <div className="auth-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input id="firstName" type="text" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" />
                </div>
                <div className="auth-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input id="lastName" type="text" name="lastName" placeholder="Okonkwo" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" />
                </div>
              </div>

              <div className="auth-group">
                <label htmlFor="schoolName">School Name *</label>
                <input id="schoolName" type="text" name="schoolName" placeholder="Lagos International Academy" value={formData.schoolName} onChange={handleChange} required />
              </div>

              <div className="auth-group">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" name="email" placeholder="admin@school.ng" value={formData.email} onChange={handleChange} autoComplete="email" />
              </div>

              <div className="auth-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input id="phoneNumber" type="tel" name="phoneNumber" placeholder="+234 801 234 5678" value={formData.phoneNumber} onChange={handleChange} onBlur={(e) => setFormData(prev => ({ ...prev, phoneNumber: formatPhoneDisplay(e.target.value) }))} autoComplete="tel" />
              </div>

              <div className="auth-group">
                <label htmlFor="password">Password *</label>
                <div className="pass-input-wrap">
                  <input id="password" type={showPassword ? "text" : "password"} name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required minLength={8} autoComplete="new-password" />
                  <button type="button" className="pass-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-auth">Next: Choose Services →</button>
            </form>

            <div className="auth-bottom-text">
              Already have an account? <Link href="/login" style={{ color: "#6A5ACD" }}>Login</Link>
            </div>
          </div>
        ) : (
          <div className="auth-card" style={{ maxWidth: "820px" }}>
            {/* Step indicator */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.5 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#6A5ACD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem" }}>1</span>
                <span style={{ fontWeight: 600, color: "#6A5ACD" }}>School Details</span>
              </div>
              <div style={{ flex: 1, height: 2, background: "#6A5ACD" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#6A5ACD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem" }}>2</span>
                <span style={{ fontWeight: 600, color: "#6A5ACD" }}>Choose Services</span>
              </div>
            </div>

            <h1 style={{ marginBottom: "0.5rem" }}>Customise Your School</h1>
            <p className="subtitle" style={{ marginBottom: "2.5rem" }}>
              Core features are free and included for every school. Add optional modules to extend functionality — you can change these anytime in your settings.
            </p>

            {/* Core services notice */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "1.2rem 1.6rem", marginBottom: "2.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "2rem" }}>✅</span>
              <div>
                <p style={{ fontWeight: 700, color: "#166534", margin: 0 }}>Included free for every school</p>
                <p style={{ color: "#15803d", margin: "0.3rem 0 0", fontSize: "1.3rem" }}>
                  Authentication, School Profile, Student Management, Teacher Management, Parent Management, Class Management
                </p>
              </div>
            </div>

                {Object.entries(servicesByCategory).map(([cat, services]) => (
              <div key={cat} style={{ marginBottom: "2.5rem" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {CATEGORY_ICONS[cat] ?? "🔧"} {CATEGORY_LABELS[cat] ?? cat}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                  {services.map((svc) => {
                    const active = selectedServices.has(svc.slug);
                    const isDependency = Array.from(selectedServices).some((slug) => {
                      const s = publicServices.find((x) => x.slug === slug);
                      return s?.dependencies.includes(svc.slug);
                    });
                    return (
                      <button
                        key={svc.slug}
                        type="button"
                        onClick={() => toggleService(svc.slug, svc)}
                        style={{
                          textAlign: "left",
                          padding: "1.2rem",
                          borderRadius: 10,
                          border: `2px solid ${active ? "#6A5ACD" : "#e2e8f0"}`,
                          background: active ? "#f3f0ff" : "#fff",
                          cursor: isDependency ? "default" : "pointer",
                          transition: "all 0.15s",
                          position: "relative",
                        }}
                      >
                        {active && (
                          <span style={{ position: "absolute", top: 10, right: 10, background: "#6A5ACD", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>✓</span>
                        )}
                        <p style={{ fontWeight: 700, margin: "0 0 0.4rem", color: active ? "#6A5ACD" : "#1e293b", fontSize: "1.3rem" }}>{svc.name}</p>
                        <p style={{ margin: "0 0 0.8rem", color: "#64748b", fontSize: "1.2rem", lineHeight: 1.4 }}>{svc.description}</p>
                        <p style={{ margin: 0, fontWeight: 700, color: active ? "#6A5ACD" : "#475569", fontSize: "1.3rem" }}>
                          {svc.base_price === 0 ? "Free" : `₦${svc.base_price.toLocaleString()}/mo`}
                        </p>
                        {isDependency && (
                          <p style={{ margin: "0.4rem 0 0", fontSize: "1.1rem", color: "#6A5ACD" }}>Required by selected service</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Summary footer */}
            <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "1.6rem", marginTop: "2rem", borderRadius: "0 0 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1.5rem", color: "#1e293b" }}>
                  Monthly estimate: <span style={{ color: "#6A5ACD" }}>₦{monthlyTotal.toLocaleString()}</span>
                </p>
                <p style={{ margin: "0.2rem 0 0", fontSize: "1.2rem", color: "#64748b" }}>
                  {selectedServices.size} optional service{selectedServices.size !== 1 ? "s" : ""} selected · You can add more later in Settings
                </p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setStep("details")} style={{ padding: "1rem 2rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}>
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-auth"
                  style={{ padding: "1rem 2.4rem", minWidth: 160 }}
                >
                  {isLoading ? "Registering..." : "Complete Registration →"}
                </button>
              </div>
            </div>
          </div>
        )}
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
