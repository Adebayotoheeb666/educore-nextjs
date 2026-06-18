"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import MarketingNavAuth from "@/components/MarketingNavAuth";

export default function ForSchools() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

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

  return (
    <div className="homepage-wrapper" style={{ fontFamily: "Manrope, sans-serif", backgroundColor: "#fff" }}>
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
            <Link href="/for-schools" className="active" onClick={() => setMenuOpen(false)}>
              For Schools
            </Link>
            <Link href="/resources" onClick={() => setMenuOpen(false)}>
              Resources
            </Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/contact-us" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <MarketingNavAuth />
        </div>
      </nav>

      {/* Hero */}
      <header className="hp-hero" style={{ background: "linear-gradient(135deg, #f3f0ff 0%, #fff 100%)", padding: "12rem 0 6rem" }}>
        <div className="hp-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ animation: "slideDown 0.8s ease-out" }}>
            <span className="hp-badge" style={{ animation: "slideRight 0.6s ease-out 0.2s both" }}>BUILT FOR SCALE</span>
            <h1 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "2rem", color: "#2d2460", lineHeight: 1.2, animation: "slideRight 0.6s ease-out 0.3s both" }}>
              The Digital Backbone for<br />Modern Nigerian Schools
            </h1>
            <p style={{ fontSize: "1.7rem", color: "#4b5563", maxWidth: "800px", margin: "0 auto 3rem", lineHeight: 1.6, animation: "slideRight 0.6s ease-out 0.4s both" }}>
              From single-campus primary schools to large multi-state secondary school networks, 
              EduCore AI provides the tools to manage every academic and administrative detail.
            </p>
            <div className="hp-hero__btns" style={{ justifyContent: "center", animation: "slideRight 0.6s ease-out 0.5s both" }}>
              <Link href="/register" className="hp-btn hp-btn--primary" style={{ whiteSpace: "nowrap" }}>
                Register Your School
              </Link>
              <Link href="/contact-us" className="hp-btn hp-btn--ghost" style={{ whiteSpace: "nowrap" }}>
                Request a Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Operational Efficiency */}
      <section style={{ padding: "8rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="responsive-grid">
            <div>
              <span className="hp-badge" style={{ marginBottom: "1.5rem" }}>OPERATIONAL EFFICIENCY</span>
              <h2 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "2rem", color: "#0f172a" }}>Transform Your Workflow.</h2>
              <p style={{ fontSize: "1.6rem", color: "#4b5563", lineHeight: "1.7" }}>
                EduCore AI reduces the administrative burden on your staff, allowing them to focus on teaching and student development.
              </p>
              <ul style={{ listStyle: "none", marginTop: "2rem", padding: 0 }}>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⏱️ <strong>Reduce Computation Time</strong> — Results computed in minutes, not days.</li>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>📄 <strong>Automated Report Cards</strong> — Eliminate manual entry with school-branded generation.</li>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🎯 <strong>Cut Prep Time by 70%</strong> — AI-generated exams and lesson plans.</li>
              </ul>
            </div>
            <div>
              <div style={{ background: "#f3f0ff", border: "1px solid #c8c1e8", padding: "4rem", borderRadius: "24px" }}>
                <h4 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "2rem", color: "#2d2460" }}>Impact Metrics</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.4rem", color: "#374151" }}>Result Computation</span>
                      <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#6A5ACD" }}>95% Faster</span>
                    </div>
                    <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px" }}>
                      <div style={{ height: "100%", width: "95%", background: "#6A5ACD", borderRadius: "4px" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.4rem", color: "#374151" }}>Exam Preparation</span>
                      <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#6A5ACD" }}>70% Faster</span>
                    </div>
                    <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px" }}>
                      <div style={{ height: "100%", width: "70%", background: "#6A5ACD", borderRadius: "4px" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Control */}
      <section style={{ padding: "8rem 0", background: "#f8fafc" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="responsive-grid-reverse">
            <div>
              <span className="hp-badge" style={{ marginBottom: "1.5rem" }}>FINANCIAL CONTROL</span>
              <h2 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "2rem", color: "#0f172a" }}>Stop Revenue Leakage.</h2>
              <p style={{ fontSize: "1.6rem", color: "#4b5563", lineHeight: "1.7" }}>
                Take complete control of your school's finances with real-time visibility into collections and outstanding debts.
              </p>
              <ul style={{ listStyle: "none", marginTop: "2rem", padding: 0 }}>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>💳 <strong>Installment Tracking</strong> — Manage partial payments with ease.</li>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔔 <strong>Fee Defaulter Alerts</strong> — Automatic reminders for outstanding balances.</li>
                <li style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>📊 <strong>Revenue Reports</strong> — Daily collection summaries and term revenue insights.</li>
              </ul>
            </div>
            <div>
              <div style={{ background: "#fff", padding: "3rem", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>Fee Collection Summary</h5>
                  <span style={{ fontSize: "1.2rem", color: "#6A5ACD", background: "#f3f0ff", padding: "0.4rem 1rem", borderRadius: "50px", fontWeight: "bold" }}>Term 2</span>
                </div>
                <div style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "1rem", color: "#0f172a" }}>₦4,250,000</div>
                <div style={{ fontSize: "1.3rem", color: "#64748b" }}>Total collected this term</div>
                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1, height: "4px", background: "#6A5ACD", borderRadius: "2px" }}></div>
                  <div style={{ flex: 0.4, height: "4px", background: "#e5e7eb", borderRadius: "2px" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Campus Section */}
      <section style={{ padding: "8rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="responsive-grid">
            <div>
              <span className="hp-badge" style={{ marginBottom: "1.5rem" }}>MULTI-CAMPUS MANAGEMENT</span>
              <h2 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "2rem", color: "#0f172a" }}>One Dashboard. Every Campus.</h2>
              <p style={{ fontSize: "1.6rem", color: "#4b5563", lineHeight: "1.7" }}>
                Manage multiple school branches from a single central account. Monitor attendance, 
                fee collection, and academic performance across all locations in real-time.
              </p>
            </div>
            <div className="text-center">
              <div style={{ background: "#2d2460", padding: "3rem", borderRadius: "24px", color: "#fff", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>Centralized Staff Management</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>Unified Financial Reporting</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>Cross-Campus Benchmarking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section style={{ padding: "8rem 0", background: "#f9fafb" }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Flexible Plans for Every Size</h2>
            <p>Choose the tier that fits your school's current needs and scale as you grow.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2.5rem" }} className="responsive-grid-3">
            {[
              { name: "Basic", price: "Free", features: ["Up to 50 Students", "Digital Attendance", "Basic Result Entry", "Parent Notifications"] },
              { name: "Standard", price: "Contact Us", features: ["Unlimited Students", "AI Lesson Plans", "AI Exam Generator", "Fee Installments", "EMIS Reports"] },
              { name: "Professional", price: "Contact Us", features: ["Multi-Campus Support", "Advanced Analytics", "Library Management", "Priority Support", "Custom Domain"] },
            ].map((tier) => (
              <div key={tier.name} style={{ background: "#fff", padding: "3rem", borderRadius: "20px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100%" }}>
                <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{tier.name}</h3>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#6A5ACD", margin: "1rem 0 2rem" }}>{tier.price}</div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: "3rem", flex: 1 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "#4b5563" }}>✓ {f}</li>
                  ))}
                </ul>
                <Link href="/register" className={`hp-btn ${tier.name === "Standard" ? "hp-btn--primary" : "hp-btn--ghost"}`} style={{ textAlign: "center", display: "block" }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Government Compliance */}
      <section style={{ padding: "8rem 0", background: "#fff" }}>
        <div className="hp-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span className="hp-badge" style={{ marginBottom: "1.5rem" }}>COMPLIANCE</span>
          <h2 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "2rem", color: "#0f172a" }}>Government Ready (EMIS/NEMIS)</h2>
          <p style={{ fontSize: "1.6rem", color: "#4b5563", maxWidth: "700px", margin: "0 auto 4rem", lineHeight: 1.6 }}>
            Export data in formats compatible with State Ministry of Education and Federal NEMIS requirements. 
            Reduce the stress of annual government data submissions.
          </p>
          <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap", fontSize: "1.5rem", color: "#374151", fontWeight: "bold" }}>
            <span>✅ NDPR Data Protection</span>
            <span>✅ Ministry Standards Compliant</span>
            <span>✅ UBEC/SUBEB Format Ready</span>
          </div>
        </div>
      </section>

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

      {/* Inline styles for responsive grid layout without Bootstrap row/col dependencies */}
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-grid, .responsive-grid-reverse, .responsive-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .responsive-grid-reverse {
            display: flex !important;
            flex-direction: column-reverse !important;
          }
        }
      `}</style>
    </div>
  );
}
