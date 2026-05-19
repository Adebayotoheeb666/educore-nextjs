"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

const CATEGORIES = [
  "All Posts",
  "Company News",
  "Educational Tips",
  "AI in Classroom",
  "Case Studies",
];

const BLOG_ADMIN_ROLES = ["super_admin", "school_owner", "admin_staff"];

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
    : "";

export default function Blog() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  
  const [activeCategory, setActiveCategory] = useState("All Posts");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const canManage = user && BLOG_ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const catParam = activeCategory === "All Posts" ? "" : encodeURIComponent(activeCategory);
      const res = await fetch(`/api/blog?page=${page}&limit=9&category=${catParam}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data.blogPosts || []);
      setTotalPages(data.totalPages || 1);
      setTotalPosts(data.totalPosts || 0);
    } catch {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const featuredPost = useMemo(
    () => posts.find((p) => p.featured) || posts[0],
    [posts]
  );

  const gridPosts = useMemo(
    () => posts.filter((p) => p.id !== featuredPost?.id),
    [posts, featuredPost]
  );

  const pageStart = totalPosts === 0 ? 0 : (page - 1) * 9 + 1;
  const pageEnd = Math.min(page * 9, totalPosts);

  return (
    <div className="blog-wrapper">
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
        </div>
      </nav>

      <div className="blog-container" style={{ marginTop: "2rem" }}>
        <header className="blog-header">
          <div className="blog-header-content">
            <h1>Knowledge Hub</h1>
            <p>Updates, insights, and resources from the EduCore AI team.</p>
          </div>
          {canManage && (
            <Link
              href={user.role === "super_admin" ? "/admin/blog" : "/dashboard"}
              className="btn-create-post"
            >
              <span>+</span> {user.role === "super_admin" ? "Manage posts" : "Manage from Dashboard"}
            </Link>
          )}
        </header>

        <nav className="blog-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </nav>

        {loading ? (
          <div style={{ padding: "8rem 4rem", textAlign: "center", color: "#64748b" }}>
            <div className="spinner-border text-primary" style={{ borderRightColor: "transparent", animation: "spinner-border .75s linear infinite" }} />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "8rem 4rem", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "1.6rem" }}>No posts yet. Visit the administrator dashboard to add articles.</p>
          </div>
        ) : (
          <>
            {featuredPost && (
              <section className="featured-post">
                <div className="featured-post-card">
                  <div className="featured-post-image">
                    <Image
                      src={featuredPost.coverImage || "/assets/teacher-main.png"}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 70vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="featured-post-content">
                    <div className="badge-container">
                      <span className="badge badge-featured">FEATURED</span>
                      {featuredPost.category && (
                        <span className="badge badge-ai">{featuredPost.category.toUpperCase()}</span>
                      )}
                    </div>
                    <h2>{featuredPost.title}</h2>
                    <p>{featuredPost.subtitle || (featuredPost.content && featuredPost.content.slice(0, 200))}</p>
                    <div className="post-footer">
                      <div className="author-info">
                        <span>{featuredPost.author?.name || "EduCore Team"}</span>
                        <span className="read-time">• {featuredPost.readTime || "5 min read"}</span>
                      </div>
                      <Link href={`/blog/${featuredPost.id}`} className="read-more">
                        Read More <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="blog-grid">
              {gridPosts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-card-image">
                    <Image
                      src={post.coverImage || "/assets/hero.png"}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                    <span className="post-card-category">{(post.category || "NEWS").toUpperCase()}</span>
                  </div>
                  <div className="post-card-content">
                    <h3>{post.title}</h3>
                    <p>{post.subtitle || (post.content && post.content.slice(0, 120))}</p>
                    <div className="post-card-footer">
                      <span className="post-date">{formatDate(post.createdAt)}</span>
                      <Link href={`/blog/${post.id}`} className="read-more">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {totalPages > 1 && (
              <footer className="pagination">
                <div className="pagination-info">
                  Showing {pageStart} to {pageEnd} of {totalPosts} posts
                </div>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn arrow"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .map((n, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && n - prev > 1;
                      return (
                        <React.Fragment key={n}>
                          {showEllipsis && <span className="pagination-info">...</span>}
                          <button
                            type="button"
                            className={`page-btn ${page === n ? "active" : ""}`}
                            onClick={() => setPage(n)}
                          >
                            {n}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    type="button"
                    className="page-btn arrow"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
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
