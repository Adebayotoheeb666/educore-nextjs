"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

export default function Resources() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
          <div className="nav-auth">
            <Link href="/dashboard" className="btn-register">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="hp-hero" style={{ background: "#2d2460", padding: "10rem 0 6rem", color: "#fff" }}>
        <div className="hp-container text-center" style={{ animation: "slideDown 0.8s ease-out" }}>
          <span className="hp-badge" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", animation: "slideRight 0.6s ease-out 0.2s both" }}>KNOWLEDGE HUB</span>
          <h1 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "2rem", color: "#fff", lineHeight: 1.2, animation: "slideRight 0.6s ease-out 0.3s both" }}>
            Educational Resources &<br />AI Insights
          </h1>
          <p style={{ fontSize: "1.7rem", color: "rgba(255,255,255,0.7)", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6, animation: "slideRight 0.6s ease-out 0.4s both" }}>
            Guides, templates, and insights to help you navigate the future of education in Nigeria.
          </p>
        </div>
      </header>

      {/* Resource Sections */}
      <section style={{ padding: "8rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }} className="responsive-grid">
            {/* AI & Teaching */}
            <div>
              <div style={{ padding: "3rem", background: "#f0fdfa", borderRadius: "24px", height: "100%" }}>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "#0f172a" }}>AI & Teaching</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {[
                    "How to use AI for Lesson Planning (NERDC Guide)",
                    "Bloom's Taxonomy in the Digital Age",
                    "Effective AI-driven Student Assessments",
                    "Teacher Capacity Building with AI Tools"
                  ].map((item) => (
                    <li key={item} style={{ fontSize: "1.5rem", marginBottom: "1.2rem" }}>
                      <Link href="#" style={{ color: "#6A5ACD", textDecoration: "none", fontWeight: 600 }}>📄 {item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* School Management */}
            <div>
              <div style={{ padding: "3rem", background: "#fefce8", borderRadius: "24px", height: "100%" }}>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1.5rem", color: "#0f172a" }}>School Management</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {[
                    "Digital Transformation Guide for Nigerian Schools",
                    "Best Practices for Fee Collection & Reconciliation",
                    "Understanding NDPR Compliance for Schools",
                    "Improving Parent Engagement via WhatsApp"
                  ].map((item) => (
                    <li key={item} style={{ fontSize: "1.5rem", marginBottom: "1.2rem" }}>
                      <Link href="#" style={{ color: "#854d0e", textDecoration: "none", fontWeight: 600 }}>📘 {item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Exam Support */}
      <section style={{ padding: "8rem 0", background: "#f9fafb" }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Curriculum & Exam Support</h2>
            <p>Comprehensive alignment with Nigerian and international educational standards.</p>
          </div>
          
          <div style={{ background: "#fff", borderRadius: "24px", padding: "4rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.5rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6", textAlign: "left" }}>
                    <th style={{ padding: "1.5rem", color: "#374151", fontWeight: 800 }}>Standard</th>
                    <th style={{ padding: "1.5rem", color: "#374151", fontWeight: 800 }}>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: "NERDC (Nigerian national curriculum)", c: "✅ Full alignment for all subjects" },
                    { s: "WAEC (WASSCE)", c: "✅ Pattern questions & result formatting" },
                    { s: "NECO", c: "✅ Pattern questions & result formatting" },
                    { s: "BECE / Junior WAEC", c: "✅ Complete support" },
                    { s: "JAMB / UTME", c: "✅ Practice question generation" },
                    { s: "Cambridge IGCSE", c: "✅ Partial support" }
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "1.5rem", fontWeight: 600, color: "#1f2937" }}>{row.s}</td>
                      <td style={{ padding: "1.5rem", color: "#6A5ACD", fontWeight: 500 }}>{row.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section style={{ padding: "8rem 0", background: "#fff" }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2>Modern Technology Stack</h2>
            <p>Built with world-class technologies to ensure reliability, security, and performance.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem" }} className="responsive-grid-4">
            {[
              { title: "Frontend", tech: "React, Redux Toolkit, Ant Design", icon: "💻" },
              { title: "Backend", tech: "Node.js, Express, MongoDB", icon: "⚙️" },
              { title: "AI & NLP", tech: "OpenAI GPT-4, Claude 3, Custom NLP", icon: "🧠" },
              { title: "Offline Support", tech: "IndexedDB, Service Workers", icon: "🔌" }
            ].map((item) => (
              <div key={item.title} style={{ padding: "2.5rem", background: "#f8fafc", borderRadius: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h5 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h5>
                <p style={{ fontSize: "1.3rem", color: "#64748b" }}>{item.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported School Types */}
      <section style={{ padding: "8rem 0", background: "#2d2460", color: "#fff" }}>
        <div className="hp-container">
          <div className="hp-section-head">
            <h2 style={{ color: "#fff" }}>Supported School Types</h2>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Tailored solutions for every level of the Nigerian education system.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="responsive-grid-3">
            {[
              "Nursery & Primary (K–6)",
              "Junior Secondary (JSS1–3)",
              "Senior Secondary (SS1–3)",
              "Group of Schools (Multi-campus)",
              "Public / Government Schools",
              "Private / Proprietory Schools"
            ].map((type) => (
              <div key={type} style={{ background: "rgba(255,255,255,0.1)", padding: "2rem", borderRadius: "16px", fontSize: "1.5rem", fontWeight: 600 }}>
                ✅ {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hp-cta">
        <div className="hp-container hp-cta__inner">
          <h2>Stay Informed</h2>
          <p>Subscribe to our newsletter for the latest in Nigerian EdTech.</p>
          <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "1rem", justifyContent: "center", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "1.2rem", fontSize: "1.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", flex: 1, outline: "none" }}
              required
            />
            <button type="submit" className="hp-btn hp-btn--primary">Subscribe</button>
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

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-grid, .responsive-grid-4, .responsive-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
