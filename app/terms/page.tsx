"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

export default function TermsPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeSection, setActiveSection] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") setIsScrolled(window.scrollY > 50);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
    return () => {};
  }, []);

  const scrollToSection = (num: number) => {
    setActiveSection(num);
    try {
      if (typeof document !== "undefined") {
        const element = document.getElementById(`section-${num}`);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="legal-wrapper" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* ── NAVBAR ── */}
      <nav className={`web-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="web-container web-navbar__inner">
          {/* Logo */}
          <Link href="/" className="web-logo">
            EduCore <span>AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Learners
            </Link>
            <Link href="/about-us" onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <Link href="/privacy" onClick={() => setMenuOpen(false)}>
              Privacy
            </Link>
            <Link href="/terms" className="active" onClick={() => setMenuOpen(false)}>
              Terms
            </Link>
            <Link href="/contact-us" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="nav-auth">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-register">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-login">
                  Login
                </Link>
                <Link href="/register" className="btn-register">
                  Explore
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="legal-container" style={{ marginTop: "2rem" }}>
        {/* Sidebar */}
        <aside className="legal-sidebar">
          <nav className="legal-nav">
            <h5 className="legal-nav-header">LEGAL DIRECTORY</h5>
            <button
              onClick={() => scrollToSection(1)}
              className={`legal-nav-item ${activeSection === 1 ? "active" : ""}`}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>📜</span> 1. Agreement
            </button>
            <button
              onClick={() => scrollToSection(2)}
              className={`legal-nav-item ${activeSection === 2 ? "active" : ""}`}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>📁</span> 2. Data Collection
            </button>
            <button
              onClick={() => scrollToSection(3)}
              className={`legal-nav-item ${activeSection === 3 ? "active" : ""}`}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>🛡️</span> 3. AI Security
            </button>
            <button
              onClick={() => scrollToSection(4)}
              className={`legal-nav-item ${activeSection === 4 ? "active" : ""}`}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>✅</span> 4. Compliance
            </button>
          </nav>

          <div className="help-card" style={{ marginTop: "2rem" }}>
            <div className="help-card-icon">💡</div>
            <h3>Need Help?</h3>
            <p>Our AI assistant can help clarify our legal terms in plain English.</p>
            <Link href="/contact-us" className="btn-start-chat" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Contact Support
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="legal-content">
          <div className="last-updated">Last Updated: October 24, 2024</div>
          <h1>Terms of Service</h1>
          <p className="legal-intro">
            Welcome to EduCore AI. These Terms of Service outline the rules and expectations for schools, administrators, teachers, and parents accessing our platform.
          </p>

          {/* Section 1 */}
          <section id="section-1" className="legal-section">
            <div className="section-title">
              <div className="section-num">1</div>
              <h2>Agreement to Terms</h2>
            </div>
            <p>
              By accessing or using the EduCore AI platform ("the Service"), you agree to be bound by these Terms. If you are using the Service on behalf of a school, university, or educational institution, you represent that you have the legal authority to bind that entity to these terms.
            </p>
            <p>
              EduCore AI provides AI-driven administrative tools, automated grading, and student performance insights. Use of these tools requires adherence to our ethical AI usage guidelines which prohibit any discriminatory or harmful application of our algorithms.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="legal-section">
            <div className="section-title">
              <div className="section-num">2</div>
              <h2>Data Collection & Usage</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", margin: "2rem 0" }} className="responsive-legal-grid">
              <div className="collection-card">
                <h4>Student Information</h4>
                <p>We collect names, enrollment numbers, and academic performance data solely for the purpose of generating insights and automating reports as requested by the institution.</p>
              </div>
              <div className="collection-card">
                <h4>Technical Metadata</h4>
                <p>Browser types, IP addresses, and interaction logs are analyzed to optimize the platform performance and ensure security across different Nigerian network providers.</p>
              </div>
            </div>
            <div className="pro-tip">
              <span>💡</span>
              <p><strong>Pro-Tip for Admins:</strong> Data provided to EduCore AI is encrypted at rest and in transit. We do not sell educational data to third-party advertisers.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="legal-section">
            <div className="section-title">
              <div className="section-num">3</div>
              <h2>AI Security & Ethical Governance</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", margin: "2rem 0" }} className="responsive-legal-grid">
              <div className="protection-card" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
                <img src="/assets/analytics-chart.png" alt="Server room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="protection-card-overlay" style={{ position: "absolute", inset: 0, background: "rgba(45,36,96,0.85)" }}></div>
                <div style={{ position: "relative", zIndex: 1, padding: "3rem", color: "#fff" }}>
                  <h3 style={{ color: "#fff", fontSize: "2rem", marginBottom: "1rem" }}>State-of-the-art Protection</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.4rem" }}>Our models are trained on air-gapped systems to ensure institutional intellectual property remains isolated from public AI datasets.</p>
                </div>
              </div>
              <div className="uptime-card" style={{ background: "#f3f0ff", padding: "3rem", borderRadius: "16px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h3 style={{ fontSize: "4rem", fontWeight: 900, color: "#6A5ACD", margin: 0 }}>99.9%</h3>
                <h4 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "1rem 0" }}>Uptime Guarantee</h4>
                <p style={{ fontSize: "1.3rem", color: "#64748b" }}>Continuous monitoring for biases and algorithmic drift.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="legal-section">
            <div className="section-title">
              <div className="section-num">4</div>
              <h2>Compliance & Local Regulation</h2>
            </div>
            <p>
              EduCore AI operates in accordance with the <strong>Nigeria Data Protection Regulation (NDPR)</strong>. We ensure that all data processing activities respecting the rights of Nigerian students and educators.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", margin: "2rem 0" }} className="responsive-legal-grid-4">
              <div className="compliance-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px solid #e5e7eb", fontSize: "1.35rem", fontWeight: "bold", color: "#2d2460" }}>
                <span>🛡️ NDPR Compliant</span>
              </div>
              <div className="compliance-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px solid #e5e7eb", fontSize: "1.35rem", fontWeight: "bold", color: "#2d2460" }}>
                <span>🔒 AES-256 Encryption</span>
              </div>
              <div className="compliance-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px solid #e5e7eb", fontSize: "1.35rem", fontWeight: "bold", color: "#2d2460" }}>
                <span>📝 Audit Trails</span>
              </div>
              <div className="compliance-card" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px solid #e5e7eb", fontSize: "1.35rem", fontWeight: "bold", color: "#2d2460" }}>
                <span>🏛️ NITDA Guidelines</span>
              </div>
            </div>
          </section>

          {/* Questions */}
          <div className="legal-footer-actions">
            <div>
              <h3>Questions about these terms?</h3>
              <p>Our legal team is available for consultation with partner institutions.</p>
            </div>
            <div className="legal-btns">
              <button className="btn-download" onClick={() => toast.success("Terms PDF download started!")}>Download PDF</button>
              <Link href="/contact-us" className="btn-contact-legal" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
                Contact Legal
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="hp-footer">
        <div className="hp-container">
          <div className="hp-footer__grid">
            <div className="hp-footer__brand">
              <span className="hp-footer__logo">EduCore <span>AI</span></span>
              <p>
                Empowering Nigerian schools through cutting-edge AI solutions.
                Built for the future of African education.
              </p>
            </div>

            <div className="hp-footer__col">
              <h5>Product</h5>
              <ul>
                <li><Link href="/">Teacher Dashboard</Link></li>
                <li><Link href="/">Parent Portal</Link></li>
                <li><Link href="/">Admin Reports</Link></li>
                <li><Link href="/">AI Analytics</Link></li>
              </ul>
            </div>

            <div className="hp-footer__col">
              <h5>Company</h5>
              <ul>
                <li><Link href="/about-us">About Us</Link></li>
                <li><Link href="/our-team">Our Team</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/contact-us">Contact Us</Link></li>
              </ul>
            </div>

            <div className="hp-footer__col">
              <h5>Support</h5>
              <ul>
                <li><Link href="/help-center">Help Center</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="hp-footer__bottom">
            <p>© 2025 EduCore AI Inc. Empowering Nigerian Education.</p>
            <div className="hp-footer__social">
              <a href="#twitter" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-legal-grid, .responsive-legal-grid-4 {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
