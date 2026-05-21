"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";

const securityFeatures = [
  {
    icon: "🔐",
    title: "AES-256 Encryption",
    description: "All data is encrypted at rest and in transit using military-grade AES-256 encryption standards."
  },
  {
    icon: "🛡️",
    title: "NDPR Compliant",
    description: "Fully compliant with Nigeria Data Protection Regulation, ensuring your data is handled according to local laws."
  },
  {
    icon: "🔒",
    title: "Two-Factor Authentication",
    description: "Optional 2FA adds an extra layer of security to protect administrator and teacher accounts."
  },
  {
    icon: "📊",
    title: "Audit Trails",
    description: "Complete logging of all system activities for transparency and accountability."
  },
  {
    icon: "🏛️",
    title: "Role-Based Access",
    description: "Granular permission controls ensure users only access data relevant to their role."
  },
  {
    icon: "💾",
    title: "Automated Backups",
    description: "Daily encrypted backups with point-in-time recovery capabilities."
  }
];

const certifications = [
  { name: "NDPR Certified", desc: "Nigeria Data Protection Regulation" },
  { name: "SOC 2 Type II", desc: "Security, Availability & Confidentiality" },
  { name: "ISO 27001", desc: "Information Security Management" },
  { name: "NITDA Approved", desc: "National IT Development Agency" }
];

export default function SecurityPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", background: "#fff" }}>
      {/* ── NAVBAR ── */}
      <nav className={`web-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="web-container web-navbar__inner">
          <Link href="/" className="web-logo">
            EduCore <span>AI</span>
          </Link>
          <div className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
            <Link href="/" onClick={() => setMenuOpen(false)}>Learners</Link>
            <Link href="/about-us" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/for-schools" onClick={() => setMenuOpen(false)}>For Schools</Link>
            <Link href="/resources" onClick={() => setMenuOpen(false)}>Resources</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link href="/contact-us" onClick={() => setMenuOpen(false)}>Contact</Link>
          </div>
          <div className="nav-auth">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-register">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-login">Login</Link>
                <Link href="/register" className="btn-register">Explore</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d2460 100%)", padding: "10rem 0 5rem", color: "#fff" }}>
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
          }}>ENTERPRISE SECURITY</span>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, marginBottom: "1.5rem", lineHeight: 1.3, animation: "slideRight 0.6s ease-out 0.3s both" }}>
            Your Data Security is Our Priority
          </h1>
          <p style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.8)", maxWidth: "650px", lineHeight: 1.6, animation: "slideRight 0.6s ease-out 0.4s both" }}>
            EduCore AI implements world-class security measures to protect sensitive student and institutional data.
          </p>
        </div>
      </header>

      {/* Security Features */}
      <section style={{ padding: "6rem 0", background: "#f9fafb" }}>
        <div className="hp-container">
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, textAlign: "center", marginBottom: "1rem", color: "#1f2937" }}>Security Features</h2>
          <p style={{ fontSize: "1.4rem", color: "#6b7280", textAlign: "center", marginBottom: "3rem", maxWidth: "600px", margin: "0 auto 3rem" }}>
            Comprehensive protection at every level of our platform
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="responsive-security-grid">
            {securityFeatures.map((feature, index) => (
              <div key={index} style={{ 
                background: "#fff", 
                borderRadius: "16px", 
                padding: "2.5rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "1.5rem" }}>{feature.icon}</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937", marginBottom: "1rem" }}>{feature.title}</h3>
                <p style={{ fontSize: "1.25rem", color: "#6b7280", lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section style={{ padding: "5rem 0", background: "#fff" }}>
        <div className="hp-container">
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, textAlign: "center", marginBottom: "3rem", color: "#1f2937" }}>Certifications & Compliance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }} className="responsive-cert-grid">
            {certifications.map((cert, index) => (
              <div key={index} style={{ 
                background: "#f3f0ff", 
                borderRadius: "12px", 
                padding: "2rem",
                textAlign: "center"
              }}>
                <h4 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d2460", marginBottom: "0.5rem" }}>{cert.name}</h4>
                <p style={{ fontSize: "1.15rem", color: "#6b7280" }}>{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section style={{ padding: "5rem 0", background: "#2d2460", color: "#fff" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="responsive-data-grid">
            <div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>Student Data Protection</h2>
              <p style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                We understand the sensitivity of student information. Our platform is designed with privacy-first principles:
              </p>
              <ul style={{ fontSize: "1.3rem", color: "rgba(255,255,255,0.8)", lineHeight: 2 }}>
                <li>Data is never sold to third parties</li>
                <li>Strict access controls and monitoring</li>
                <li>Regular security audits and penetration testing</li>
                <li>Transparent data handling practices</li>
                <li>Easy data export and deletion requests</li>
              </ul>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "16px", padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "5rem", fontWeight: 900, color: "#6A5ACD", marginBottom: "1rem" }}>99.9%</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Uptime SLA</div>
              <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.7)" }}>Industry-leading reliability for Nigerian schools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Report Vulnerability */}
      <section style={{ padding: "5rem 0", background: "#f9fafb" }}>
        <div className="hp-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "#1f2937" }}>Report a Security Concern</h2>
          <p style={{ fontSize: "1.4rem", color: "#6b7280", marginBottom: "2rem", maxWidth: "550px" }}>
            Found a vulnerability? We appreciate responsible disclosure. Contact our security team immediately.
          </p>
          <Link href="/contact-us" style={{
            display: "inline-block",
            padding: "1rem 2.5rem",
            fontSize: "1.3rem",
            fontWeight: 600,
            borderRadius: "8px",
            background: "#2d2460",
            color: "#fff",
            textDecoration: "none"
          }}>
            Contact Security Team
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hp-footer">
        <div className="hp-container">
          <div className="hp-footer__grid">
            <div className="hp-footer__brand">
              <span className="hp-footer__logo">EduCore <span>AI</span></span>
              <p>Empowering Nigerian schools through cutting-edge AI solutions. Built for the future of African education.</p>
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

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-security-grid, .responsive-cert-grid, .responsive-data-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .responsive-security-grid, .responsive-cert-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
