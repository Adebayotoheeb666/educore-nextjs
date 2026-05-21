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
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        <div className="about-container">
          <div className="mission-badge">OUR MISSION</div>
          <h1>Revolutionizing Nigerian Education Through Intelligence.</h1>
          <p>
            At EduCore AI, we bridge the gap between traditional learning and the
            digital future, providing administrators with the tools to empower the next
            generation of Nigerian leaders.
          </p>
          <div className="hero-btns">
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
                width={600}
                height={450}
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
                By leveraging artificial intelligence tailored specifically for our unique educational landscape, we've created a system that handles the heavy lifting—from automated attendance to predictive academic insights.
              </p>
              
              <div className="excellence-features">
                <div className="excellence-feat">
                  <div className="feat-icon">📍</div>
                  <div className="feat-text">
                    <h4>Locally Rooted</h4>
                    <p>Designed for the specific needs of Nigerian public and private institutions.</p>
                  </div>
                </div>
                <div className="excellence-feat">
                  <div className="feat-icon">📈</div>
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
              <div className="stat-card-icon">📅</div>
              <h3>2022</h3>
              <p>Year Founded</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🎧</div>
              <h3>24/7</h3>
              <p>Dedicated Support</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">👥</div>
              <h3>50+</h3>
              <p>Team of Educators</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🎓</div>
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
              <div className="brain-icon">🧠</div>
              <div className="empower-badge">✨ AI EXCELLENCE</div>
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
                  <div className="avatar" />
                  <div className="avatar" />
                  <div className="avatar" />
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
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
