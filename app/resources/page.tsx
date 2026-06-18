"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import MarketingNavAuth from "@/components/MarketingNavAuth";

export default function Resources() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");

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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed successfully!");
    setEmail("");
  };

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
            <Link href="/for-schools" onClick={() => setMenuOpen(false)}>
              For Schools
            </Link>
            <Link href="/resources" className="active" onClick={() => setMenuOpen(false)}>
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
      <header style={{ background: "#2d2460", padding: "8rem 0 5rem", color: "#fff" }}>
        <div className="hp-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: "slideDown 0.8s ease-out" }}>
          <span style={{ 
            display: "inline-block",
            background: "rgba(255,255,255,0.15)", 
            color: "#fff", 
            padding: "0.6rem 1.6rem",
            borderRadius: "50px",
            fontSize: "1.2rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            marginBottom: "2rem",
            animation: "slideRight 0.6s ease-out 0.2s both"
          }}>KNOWLEDGE HUB</span>
          <h1 style={{ fontSize: "3.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "#fff", lineHeight: 1.3, animation: "slideRight 0.6s ease-out 0.3s both" }}>
            Educational Resources &<br />AI Insights
          </h1>
          <p style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.7)", maxWidth: "600px", lineHeight: 1.6, animation: "slideRight 0.6s ease-out 0.4s both" }}>
            Guides, templates, and insights to help you navigate the future of education in Nigeria.
          </p>
        </div>
      </header>

      {/* Resource Cards Section */}
      <section style={{ padding: "5rem 0", background: "#f8f9fa" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="responsive-grid">
            {/* AI & Teaching Card */}
            <div style={{ 
              background: "#fff", 
              borderRadius: "12px", 
              padding: "2rem",
              borderLeft: "4px solid #8b5cf6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "#1f2937" }}>AI & Teaching</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "How to use AI for Lesson Planning (NERDC Guide)",
                  "Bloom's Taxonomy in the Digital Age",
                  "Effective AI-driven Student Assessments",
                  "Teacher Capacity Building with AI Tools"
                ].map((item) => (
                  <li key={item} style={{ marginBottom: "1rem" }}>
                    <Link href="#" style={{ color: "#8b5cf6", textDecoration: "none", fontSize: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <span style={{ color: "#8b5cf6" }}>📄</span> {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* School Management Card */}
            <div style={{ 
              background: "#fff", 
              borderRadius: "12px", 
              padding: "2rem",
              borderLeft: "4px solid #3b82f6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "#1f2937" }}>School Management</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "Digital Transformation Guide for Nigerian Schools",
                  "Best Practices for Fee Collection & Reconciliation",
                  "Understanding NDPR Compliance for Schools",
                  "Improving Parent Engagement via WhatsApp"
                ].map((item) => (
                  <li key={item} style={{ marginBottom: "1rem" }}>
                    <Link href="#" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <span style={{ color: "#3b82f6" }}>■</span> {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Exam Support */}
      <section style={{ padding: "5rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div className="text-center" style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem", color: "#1f2937" }}>Curriculum & Exam Support</h2>
            <p style={{ fontSize: "1.3rem", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
              Comprehensive alignment with Nigerian and international educational standards.
            </p>
          </div>
          
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.25rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "1rem 0", textAlign: "left", color: "#374151", fontWeight: 600 }}>Standard</th>
                  <th style={{ padding: "1rem 0", textAlign: "left", color: "#374151", fontWeight: 600 }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: "NERDC (Nigerian national curriculum)", c: "Full alignment for all subjects", color: "#8b5cf6" },
                  { s: "WAEC (WASSCE)", c: "Pattern questions & result formatting", color: "#3b82f6" },
                  { s: "NECO", c: "Pattern questions & result formatting", color: "#3b82f6" },
                  { s: "BECE / Junior WAEC", c: "Complete support", color: "#10b981" },
                  { s: "JAMB / UTME", c: "Practice question generation", color: "#8b5cf6" },
                  { s: "Cambridge IGCSE", c: "Partial support", color: "#8b5cf6" }
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "1rem 0", fontWeight: 500, color: "#1f2937" }}>{row.s}</td>
                    <td style={{ padding: "1rem 0", color: row.color, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: row.color }}>✓</span> {row.c}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modern Technology Stack */}
      <section style={{ padding: "5rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div className="text-center" style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem", color: "#1f2937" }}>Modern Technology Stack</h2>
            <p style={{ fontSize: "1.3rem", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
              Built with world-class technologies to ensure reliability, security, and performance.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }} className="responsive-grid-4">
            {[
              { title: "Frontend", tech: "React, Redux Toolkit, Ant Design", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              )},
              { title: "Backend", tech: "Node.js, Express, MongoDB", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              )},
              { title: "AI & NLP", tech: "OpenAI GPT-4, Claude 3, Custom NLP", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )},
              { title: "Offline Support", tech: "IndexedDB, Service Workers", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
            ].map((item) => (
              <div key={item.title} style={{ 
                padding: "2rem 1.5rem", 
                background: "#f8fafc", 
                borderRadius: "12px", 
                textAlign: "center",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>{item.icon}</div>
                <h5 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>{item.title}</h5>
                <p style={{ fontSize: "1.1rem", color: "#6b7280", lineHeight: 1.4 }}>{item.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported School Types */}
      <section style={{ padding: "5rem 0", background: "#1f2937", color: "#fff" }}>
        <div className="hp-container">
          <div className="text-center" style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem", color: "#fff" }}>Supported School Types</h2>
            <p style={{ fontSize: "1.3rem", color: "rgba(255,255,255,0.6)", maxWidth: "500px", margin: "0 auto" }}>
              Tailored solutions for every level of the Nigerian education system.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", maxWidth: "800px", margin: "0 auto" }} className="responsive-grid-3">
            {[
              "Nursery & Primary (K–6)",
              "Junior Secondary (JSS1–3)",
              "Senior Secondary (SS1–3)",
              "Group of Schools (Multi-campus)",
              "Public / Government Schools",
              "Private / Proprietory Schools"
            ].map((type) => (
              <div key={type} style={{ 
                background: "rgba(255,255,255,0.1)", 
                padding: "1.2rem 1.5rem", 
                borderRadius: "8px", 
                fontSize: "1.2rem", 
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <span style={{ color: "#10b981" }}>✓</span> {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stay Informed CTA */}
      <section style={{ padding: "5rem 0", background: "#f8f9fa" }}>
        <div className="hp-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem", color: "#1f2937" }}>Stay Informed</h2>
          <p style={{ fontSize: "1.3rem", color: "#6b7280", marginBottom: "2rem" }}>
            Subscribe to our newsletter for the latest in Nigerian EdTech.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.75rem", justifyContent: "center", maxWidth: "450px", width: "100%" }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                padding: "1rem 1.25rem", 
                fontSize: "1.2rem", 
                borderRadius: "8px", 
                border: "1px solid #d1d5db", 
                background: "#fff", 
                color: "#1f2937", 
                flex: 1, 
                outline: "none" 
              }}
              required
            />
            <button 
              type="submit" 
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                background: "#2d2460",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Subscribe
            </button>
          </form>
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
              <a href="#instagram" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-grid, .responsive-grid-4, .responsive-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .responsive-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
