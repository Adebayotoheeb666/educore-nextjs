"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  
  const [formData, setFormData] = useState({
    name: "",
    schoolName: "",
    email: "",
    subject: "School Onboarding",
    message: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `${formData.schoolName ? `[${formData.schoolName}] ` : ""}${formData.subject}`,
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send message");
      toast.success("Message sent successfully!");
      setFormData({ name: "", schoolName: "", email: "", subject: "School Onboarding", message: "" });
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-wrapper" style={{ fontFamily: "Manrope, sans-serif" }}>
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
            <Link href="/resources" onClick={() => setMenuOpen(false)}>
              Resources
            </Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/contact-us" className="active" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="nav-auth">
            <Link href="/dashboard" className="btn-register">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-container" style={{ animation: "slideDown 0.8s ease-out" }}>
          <div className="help-badge" style={{ animation: "slideRight 0.6s ease-out 0.2s both" }}>
            <span>✨</span> WE ARE HERE TO HELP
          </div>
          <h1 style={{ animation: "slideRight 0.6s ease-out 0.3s both" }}>Get in Touch</h1>
          <p style={{ animation: "slideRight 0.6s ease-out 0.4s both" }}>
            Have questions about integrating EduCore AI into your school? Our team of
            educational technology experts is ready to assist you.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="contact-main">
        <div className="contact-container">
          <div className="contact-grid">
            
            {/* Left Column: Office Info */}
            <aside className="office-card">
              <h2>Our Offices</h2>
              
              <div className="contact-method">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Lagos Headquarters</h4>
                  <p>42 Tech Plaza, Victoria Island,<br />Lagos State, Nigeria</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">🏢</div>
                <div className="contact-details">
                  <h4>Abuja Regional Office</h4>
                  <p>Suite 105, Unity House, Garki Area 11,<br />FCT Abuja, Nigeria</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email Us</h4>
                  <p>support@educore.ai<br />partnerships@educore.ai</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Call Support</h4>
                  <p>+234 (0) 800 EDU CORE<br />+234 1 234 5678</p>
                </div>
              </div>

              <div className="map-placeholder">
                <img src="/assets/analytics-chart.png" alt="Map Location" />
              </div>
            </aside>

            {/* Right Column: Contact Form */}
            <main className="form-card">
              <h2>Send a Message</h2>
              <p>Fill out the form below and an AI implementation specialist will contact you within 24 hours.</p>
              
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Adebayo Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>School Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bright Minds Academy"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@school.edu.ng"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group full">
                  <label>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="School Onboarding">School Onboarding</option>
                    <option value="Demo Request">Demo Request</option>
                    <option value="Pricing Inquiry">Pricing Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us about your school's needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-send" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"} <span>➤</span>
                </button>
              </form>

              <div className="ndpr-note">
                <span>🛡️</span>
                <p>Your data is encrypted and managed according to Nigerian Data Protection Regulations (NDPR).</p>
              </div>
            </main>

          </div>
        </div>
      </section>

      {/* Quick Answers Section */}
      <section className="quick-answers">
        <div className="contact-container">
          <h2>Quick Answers?</h2>
          <p>Visit our support center for instant guides on setup, attendance tracking, and AI grading features.</p>
          <div className="qa-buttons">
            <Link href="/" className="btn-qa-primary">
              Go to Support Center
            </Link>
            <Link href="/blog" className="btn-qa-secondary">
              Read Knowledge Base
            </Link>
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
    </div>
  );
}
