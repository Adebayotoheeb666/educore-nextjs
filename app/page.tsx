"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import "./homepage.css";

export default function Homepage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="homepage-wrapper" style={{ fontFamily: "Manrope, sans-serif" }}>
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
            <Link href="/terms" onClick={() => setMenuOpen(false)}>
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

          {/* Hamburger */}
          <button
            className={`nav-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ display: "none" } /* will be responsive styled in css */}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <header className="hp-hero">
        <div className="hp-container hp-hero__inner">
          <div className="hp-hero__text">
            <span className="hp-badge">✦ AI GENERATE K-12 EDUCATION PLATFORM</span>
            <h1>
              Transforming Learning<br />
              Across Nigeria with AI.
            </h1>
            <p>
              Empower your institution with a true digital solution designed for the Nigerian context. 
              NERDC curriculum alignment, offline-first design, WAEC/NECO/JAMB preparation, 
              and automated administration — all in one unified platform.
            </p>
            <div className="hp-hero__btns">
              {isAuthenticated ? (
                <Link href="/dashboard" className="hp-btn hp-btn--primary">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/register" className="hp-btn hp-btn--primary">
                    Get Started Free →
                  </Link>
                  <Link href="/about-us" className="hp-btn hp-btn--ghost">
                    Learn More
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hp-hero__visual">
            <div className="hp-hero__img-wrap">
              <img
                src="/assets/hero.png"
                alt="EduCore AI dashboard"
                className="hp-hero__img"
              />
              <div className="hp-glow hp-glow--1" />
              <div className="hp-glow hp-glow--2" />
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. STATS BAR ── */}
      <section className="hp-stats">
        <div className="hp-container hp-stats__grid">
          <div className="hp-stat">
            <h3>500+</h3>
            <p>Schools Onboarded</p>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <h3>100k+</h3>
            <p>Students Learning</p>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <h3>2.5M</h3>
            <p>Lessons Generated</p>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES GRID ── */}
      <section className="hp-features">
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Everything you need to lead.</h2>
            <p>
              From individual classrooms to entire school networks, EduCore AI
              covers all your needs.
            </p>
          </div>

          <div className="hp-features__grid">
            {/* Card 1 — AI Lesson Plans */}
            <div className="hp-feat-card hp-feat-card--light">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3>AI Lesson Plan Generation</h3>
              <p>
                Auto-generate complete, structured lesson plans aligned to the official NERDC Nigerian curriculum for all subjects and class levels (Primary 1–6, JSS1–3, SS1–3).
              </p>
              <div className="hp-feat-card__tags">
                <span>NERDC Aligned</span>
                <span>Bloom's Taxonomy</span>
              </div>
            </div>

            {/* Card 2 — AI Exam Generator */}
            <div className="hp-feat-card hp-feat-card--dark">
              <div className="hp-feat-card__icon hp-feat-card__icon--teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3>AI Exam & Test Generation</h3>
              <p>
                Generate exam questions modelled after WAEC, NECO, and JAMB patterns. Specify difficulty levels and auto-shuffle options to prevent malpractice.
              </p>
              <div className="hp-feat-card__visual">
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "1.5rem", borderRadius: "12px", fontSize: "1.2rem" }}>
                  <div style={{ marginBottom: "0.8rem", opacity: 0.8 }}>Generating JSS3 Math Exam...</div>
                  <div style={{ height: "4px", background: "#14b8a6", width: "70%", borderRadius: "2px" }} />
                </div>
              </div>
            </div>

            {/* Card 3 — AI Grading */}
            <div className="hp-feat-card hp-feat-card--light">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3>AI Grading & Assessment</h3>
              <p>
                Instant objective grading and rubric-based essay scoring. Automatically compute CA scores, term averages, and class rankings.
              </p>
            </div>

            {/* Card 4 — School Management */}
            <div className="hp-feat-card hp-feat-card--medium">
              <div className="hp-feat-card__icon hp-feat-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3>Admin & Student Portal</h3>
              <p>
                Comprehensive management of student profiles, attendance, behavioral records, and automated school-branded report cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TEACHERS SECTION ── */}
      <section className="hp-teachers">
        <div className="hp-container hp-teachers__inner">
          <div className="hp-teachers__left">
            <h2>Superpowers for<br />Teachers.</h2>
            <p>
              We believe teachers are the heart of education. EduCore AI
              automates the "busy work" so they can focus on what
              matters most — inspiring students.
            </p>
            <ul className="hp-check-list">
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>Term-Long Schemes of Work</strong>
                  <span>Automatically generate term-long schemes from a single subject and class selection.</span>
                </div>
              </li>
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>WAEC / NECO Pattern Questions</strong>
                  <span>Access or generate exam questions modelled after past external examination patterns.</span>
                </div>
              </li>
              <li>
                <span className="hp-check">✓</span>
                <div>
                  <strong>Offline Access</strong>
                  <span>Download and access lesson plans and student records even without internet connectivity.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="hp-teachers__right">
            <div className="hp-teachers__img-stack">
              <img
                src="/assets/teacher-main.png"
                alt="Teacher using EduCore"
                className="hp-teachers__img-main"
              />
              <img
                src="/assets/teacher-group.png"
                alt="Teacher group collaboration"
                className="hp-teachers__img-secondary"
              />
              <div className="hp-teachers__badge">
                <span className="hp-badge-pct">94%</span>
                <p>Teacher satisfaction rate<br />in beta pilot schools</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PARENTS SECTION ── */}
      <section className="hp-parents">
        <div className="hp-container hp-parents__inner">
          <div className="hp-parents__left">
            <div className="hp-parents__phone-wrap">
              <img
                src="/assets/parent_portal.png"
                alt="Parent portal app"
                className="hp-parents__phone"
              />
              <div className="hp-parents__phone-badge">
                <span className="hp-parents__badge-icon">📊</span>
                <p><strong>Attendance alert</strong><br />Your ward arrived at 8:14 am today</p>
              </div>
            </div>
          </div>

          <div className="hp-parents__right">
            <h2>Peace of Mind<br />for Parents.</h2>
            <p>
              Bridging the gap between school and home with WhatsApp-first 
              communication and real-time updates on what matters most.
            </p>

            <div className="hp-parents__features">
              <div className="hp-parents__feat">
                <span className="hp-parents__feat-icon">💬</span>
                <div>
                  <h4>WhatsApp & SMS Alerts</h4>
                  <p>Receive report cards, fee reminders, and attendance alerts directly via WhatsApp.</p>
                </div>
              </div>
              <div className="hp-parents__feat">
                <span className="hp-parents__feat-icon">💳</span>
                <div>
                  <h4>Flexible Fee Payments</h4>
                  <p>Pay in installments via Paystack or Flutterwave and receive instant digital receipts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5.5 NIGERIAN DESIGN SECTION ── */}
      <section className="hp-nigeria">
        <div className="hp-container">
          <div className="hp-section-head">
            <span className="hp-badge">LOCALLY OPTIMIZED</span>
            <h2>Built for the Nigerian Context.</h2>
            <p>EduCore AI is not a generic platform — it's built from the ground up for our unique educational environment.</p>
          </div>

          <div className="hp-nigeria__grid">
            <div className="hp-nigeria__item">
              <div className="hp-nigeria__icon">🔌</div>
              <h4>Offline-First Design</h4>
              <p>Handle frequent power outages and unreliable internet without data loss. Syncs automatically when back online.</p>
            </div>
            <div className="hp-nigeria__item">
              <div className="hp-nigeria__icon">📡</div>
              <h4>Low-Bandwidth Mode</h4>
              <p>Optimized to run smoothly even on slow 3G connections common across many states.</p>
            </div>
            <div className="hp-nigeria__item">
              <div className="hp-nigeria__icon">💰</div>
              <h4>Installment Fee Tracking</h4>
              <p>Manage the reality of partial payments with automated balance tracking and reminders.</p>
            </div>
            <div className="hp-nigeria__item">
              <div className="hp-nigeria__icon">🇳🇬</div>
              <h4>Ministry Compliance</h4>
              <p>Generate EMIS/NEMIS-compliant reports for State Ministries and Federal agencies in one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA SECTION ── */}
      <section className="hp-cta">
        <div className="hp-container hp-cta__inner">
          <h2>Ready to modernize your school?</h2>
          <p>
            Join hundreds of Nigerian institutions leading the digital
            revolution in education. Start your free trial today.
          </p>
          <div className="hp-cta__btns">
            {isAuthenticated ? (
              <Link href="/dashboard" className="hp-btn hp-btn--primary">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/register" className="hp-btn hp-btn--primary">
                  Create School Account
                </Link>
                <Link href="/contact-us" className="hp-btn hp-btn--outline-light">
                  Speak with an Expert
                </Link>
              </>
            )}
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
                <li><Link href="/">Our Team</Link></li>
                <li><Link href="/">Careers</Link></li>
                <li><Link href="/contact-us">Contact Us</Link></li>
              </ul>
            </div>

            <div className="hp-footer__col">
              <h5>Support</h5>
              <ul>
                <li><Link href="/">Help Center</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/">Security</Link></li>
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
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
