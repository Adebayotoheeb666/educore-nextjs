"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";

const teamMembers = [
  {
    name: "Adebayo Okonkwo",
    role: "Founder & CEO",
    bio: "Former EdTech consultant with 15+ years in Nigerian education sector. Passionate about leveraging AI to transform learning outcomes.",
    image: "/assets/team/ceo.png"
  },
  {
    name: "Chioma Adeyemi",
    role: "Chief Technology Officer",
    bio: "Ex-Google engineer with expertise in machine learning and scalable systems. Leading our AI development initiatives.",
    image: "/assets/team/cto.png"
  },
  {
    name: "Oluwaseun Bakare",
    role: "Head of Product",
    bio: "Product leader with experience at top African startups. Focused on building intuitive tools for educators.",
    image: "/assets/team/product.png"
  },
  {
    name: "Fatima Ibrahim",
    role: "Director of Education",
    bio: "Former school principal with deep understanding of Nigerian curriculum requirements and educational standards.",
    image: "/assets/team/education.png"
  },
  {
    name: "Emeka Nwosu",
    role: "Head of Engineering",
    bio: "Full-stack architect specializing in secure, scalable educational platforms for emerging markets.",
    image: "/assets/team/engineering.png"
  },
  {
    name: "Amina Yusuf",
    role: "Customer Success Lead",
    bio: "Dedicated to ensuring schools get maximum value from EduCore AI with personalized onboarding and support.",
    image: "/assets/team/success.png"
  }
];

export default function OurTeamPage() {
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
    <div className="our-team-wrapper">
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
      <header className="team-hero">
        <div className="hp-container team-hero__content">
          <span className="team-hero__badge">MEET THE TEAM</span>
          <h1 className="team-hero__title">The People Behind EduCore AI</h1>
          <p className="team-hero__subtitle">A passionate team of educators, engineers, and innovators dedicated to transforming Nigerian education.</p>
        </div>
      </header>

      {/* Team Grid */}
      <section className="team-grid-section">
        <div className="hp-container">
          <div className="team-grid responsive-team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-card">
                <div className="team-member-avatar">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="team-member-name">{member.name}</h3>
                <p className="team-member-role">{member.role}</p>
                <p className="team-member-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="team-cta-section">
        <div className="hp-container team-cta-content">
          <h2 className="team-cta-title">Want to Join Our Team?</h2>
          <p className="team-cta-text">We are always looking for talented individuals passionate about education and technology.</p>
          <Link href="/careers" className="team-cta-btn">View Open Positions</Link>
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
          .responsive-team-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .responsive-team-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
