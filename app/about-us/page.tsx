"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";

export default function AboutPage() {
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
    <div className="about-wrapper">
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
            <Link href="/about-us" className="active" onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <Link href="/for-schools" onClick={() => setMenuOpen(false)}>
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
          <div className="nav-auth">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-register">
                Dashboard
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-register">
                Dashboard
              </Link>
            )}
          </div>

          {/* Hamburger Menu */}
          <button
            className={`nav-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <Image
          src="/assets/teacher-main.png"
          alt="Classroom"
          className="about-hero-bg"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="about-hero-overlay" />
        <div className="about-container" style={{ animation: "slideDown 0.8s ease-out" }}>
          <div className="mission-badge" style={{ animation: "slideRight 0.6s ease-out 0.2s both" }}>OUR MISSION</div>
          <h1 style={{ animation: "slideRight 0.6s ease-out 0.3s both" }}>Revolutionizing Nigerian Education Through Intelligence.</h1>
          <p style={{ animation: "slideRight 0.6s ease-out 0.4s both" }}>
            At EduCore AI, we bridge the gap between traditional learning and the
            digital future, providing administrators with the tools to empower the next
            generation of Nigerian leaders.
          </p>
          <div className="hero-btns" style={{ animation: "slideRight 0.6s ease-out 0.5s both" }}>
            <Link href="/contact-us" className="btn-about-primary">
              Our Impact
            </Link>
            <Link href="/blog" className="btn-about-outline">
              Watch Story
            </Link>
          </div>
        </div>
      </section>

      {/* Excellence Section */}
      <section className="excellence-section">
        <div className="about-container">
          <div className="excellence-grid">
            <div className="excellence-image">
              <Image
                src="/assets/teacher-group.png"
                alt="Team collaborating"
                className="main-img"
                width={480}
                height={360}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="journey-box">
                <h4>2022</h4>
                <p>The year our journey to redefine school management began.</p>
              </div>
            </div>
            <div className="excellence-content">
              <h2>A Commitment to Excellence</h2>
              <p>
                EduCore AI was born in the heart of Lagos with a singular vision: to solve the complex administrative challenges facing Nigerian schools. We recognized that for education to thrive, teachers need time to teach, and administrators need data to lead.
              </p>
              <p>
                By leveraging artificial intelligence tailored specifically for our unique educational landscape, we&apos;ve created a system that handles the heavy lifting—from automated attendance to predictive academic insights.
              </p>
              
              <div className="excellence-features">
                <div className="excellence-feat">
                  <div className="feat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="feat-text">
                    <h4>Locally Rooted</h4>
                    <p>Designed for the specific needs of Nigerian public and private institutions.</p>
                  </div>
                </div>
                <div className="excellence-feat">
                  <div className="feat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <div className="feat-text">
                    <h4>Scalable Innovation</h4>
                    <p>Built to grow with your school, from 100 students to 10,000.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="about-stats">
        <div className="about-container">
          <div className="stats-header">
            <h2>By the Numbers</h2>
            <p>Our growth is a testament to the trust schools place in our AI-driven ecosystem.</p>
          </div>
          <div className="about-stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <text x="9" y="18" fontSize="8" fill="currentColor" fontWeight="bold">17</text>
                </svg>
              </div>
              <h3>2022</h3>
              <p>Year Founded</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <h3>24/7</h3>
              <p>Dedicated Support</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <h3>50+</h3>
              <p>Team of Educators</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                </svg>
              </div>
              <h3>250+</h3>
              <p>Schools Empowered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Empowering Teachers Section */}
      <section className="empower-section">
        <div className="about-container">
          <div className="empower-grid">
            <div className="empower-main-card">
              <div className="brain-icon">
                <svg viewBox="0 0 64 64" fill="none" width="160" height="160">
                  <ellipse cx="32" cy="32" rx="28" ry="26" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <ellipse cx="24" cy="26" rx="10" ry="12" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
                  <ellipse cx="40" cy="26" rx="10" ry="12" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
                  <path d="M20 38 C20 44 26 50 32 50 C38 50 44 44 44 38" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
                  <path d="M28 20 Q32 16 36 20" stroke="currentColor" strokeWidth="1" opacity="0.25" />
                  <circle cx="22" cy="28" r="2" fill="currentColor" opacity="0.2" />
                  <circle cx="42" cy="28" r="2" fill="currentColor" opacity="0.2" />
                  <path d="M18 32 Q14 32 14 28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <path d="M46 32 Q50 32 50 28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                </svg>
              </div>
              <div className="empower-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                </svg>
                AI EXCELLENCE
              </div>
              <h2>Empowering Teachers, Not Replacing Them.</h2>
              <p>
                Our AI modules are designed to assist educators by automating grading, identifying struggling students early, and creating personalized learning paths.
              </p>
            </div>
            <div className="empower-side">
              <div className="side-card side-card-blue">
                <h4>Academic Gold</h4>
                <p>Our proprietary algorithm for predicting student success rates with 98% accuracy.</p>
                <div className="avatars">
                  <div className="avatar" style={{ backgroundColor: '#6b7280' }} />
                  <div className="avatar" style={{ backgroundColor: '#9ca3af' }} />
                  <div className="avatar" style={{ backgroundColor: '#d1d5db' }} />
                </div>
              </div>
              <div className="side-card side-card-green">
                <h4>Global Standards</h4>
                <p>Meeting international data privacy and educational compliance standards.</p>
                <Link href="/privacy" className="learn-more">
                  Learn More
                </Link>
              </div>
            </div>
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
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#instagram" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
