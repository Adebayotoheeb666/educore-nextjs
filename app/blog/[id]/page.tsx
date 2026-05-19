"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

const BLOG_ADMIN_ROLES = ["super_admin", "school_owner", "admin_staff"];

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" })
    : "";

const renderContent = (content: string) => {
  if (!content) return null;
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith(">")) {
      return (
        <blockquote key={i} className="bp-quote">
          {trimmed.replace(/^>\s?/, "")}
        </blockquote>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split("\n").filter((l) => l.trim());
      return (
        <ol key={i} style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^\d+\.\s/, "")}</li>
          ))}
        </ol>
      );
    }
    return <p key={i} style={{ fontSize: "1.58rem", lineHeight: 1.75, color: "#374151", marginBottom: "2.4rem" }}>{trimmed}</p>;
  });
};

export default function BlogPost() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = user && BLOG_ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/blog/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setPost(data);
        return fetch(`/api/blog?category=${encodeURIComponent(data.category)}&limit=4`);
      })
      .then((res) => res.json())
      .then((list) => {
        setRelated((list.blogPosts || []).filter((p: any) => p.id !== id).slice(0, 3));
      })
      .catch(() => {
        setPost(null);
        toast.error("Failed to load blog post");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      toast.success("Thanks for subscribing!");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success("Post deleted successfully");
      router.push("/blog");
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="bp-root" style={{ fontFamily: "Manrope, sans-serif" }}>
        {/* ── NAVBAR ── */}
        <nav className={`web-navbar ${isScrolled ? "scrolled" : ""}`}>
          <div className="web-container web-navbar__inner">
            <Link href="/" className="web-logo">
              EduCore <span>AI</span>
            </Link>
          </div>
        </nav>
        <div style={{ padding: "12rem 6rem", textAlign: "center" }}>
          <div className="spinner-border text-primary" style={{ borderRightColor: "transparent", animation: "spinner-border .75s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bp-root" style={{ fontFamily: "Manrope, sans-serif" }}>
        {/* ── NAVBAR ── */}
        <nav className={`web-navbar ${isScrolled ? "scrolled" : ""}`}>
          <div className="web-container web-navbar__inner">
            <Link href="/" className="web-logo">
              EduCore <span>AI</span>
            </Link>
          </div>
        </nav>
        <div style={{ padding: "12rem 6rem", textAlign: "center" }}>
          <h2>Post not found</h2>
          <Link href="/blog" className="bp-related__view-all" style={{ marginTop: "2rem" }}>
            Back to Knowledge Hub
          </Link>
        </div>
      </div>
    );
  }

  const authorInitials = (post.author?.name || "ET")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bp-root" style={{ fontFamily: "Manrope, sans-serif" }}>
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

      <div className="bp-hero">
        <img
          src={post.coverImage || "/assets/hero.png"}
          alt={post.title}
          className="bp-hero__img"
        />
        <div className="bp-hero__overlay" />

        {canManage && (
          <div className="bp-hero__actions">
            {user.role === "super_admin" && (
              <Link
                href={`/admin/blog/${id}/edit`}
                className="bp-action-btn"
                style={{ textDecoration: "none", marginRight: "0.5rem" }}
              >
                Edit
              </Link>
            )}
            <button
              type="button"
              className="bp-action-btn bp-action-btn--delete"
              onClick={() => setShowDeleteModal(true)}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "16px", height: "16px" }}><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Delete
            </button>
          </div>
        )}

        <div className="bp-hero__meta">
          <span className="bp-category">{post.category || "Article"}</span>
          <span className="bp-meta-text">
            {formatDate(post.createdAt)} · {post.readTime || "5 min read"}
          </span>
          <h1 className="bp-hero__title">{post.title}</h1>
          {post.subtitle && <p style={{ fontSize: "1.6rem", opacity: 0.9, marginTop: "0.5rem", color: "#fff" }}>{post.subtitle}</p>}
          <div className="bp-author" style={{ marginTop: "1.5rem" }}>
            <div className="bp-author__avatar">
              <span className="bp-author__initials">{authorInitials}</span>
            </div>
            <div>
              <p className="bp-author__name">{post.author?.name || "EduCore Team"}</p>
              <p className="bp-author__role">{post.author?.role || "EduCore AI"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bp-body">
        <div className="bp-container bp-layout">
          <article className="bp-article">
            {renderContent(post.content)}
            {(post.tags || []).length > 0 && (
              <div className="bp-tags">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="bp-tag">{tag.startsWith("#") ? tag : `#${tag}`}</span>
                ))}
              </div>
            )}
          </article>

          <aside className="bp-sidebar">
            <div className="bp-newsletter">
              <div className="bp-newsletter__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "22px", height: "22px", color: "#4ade80" }}>
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "0.8rem" }}>Weekly Insights</h3>
              <p style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: "2rem" }}>Get the latest school management tips and product updates in your inbox.</p>
              {subscribed ? (
                <div className="bp-newsletter__success">
                  <span>✅</span> You&apos;re subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="bp-newsletter__form">
                  <input
                    type="email"
                    placeholder="principal@school.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bp-newsletter__input"
                  />
                  <button type="submit" className="bp-newsletter__btn">
                    Subscribe Now →
                  </button>
                </form>
              )}
            </div>

            <div className="bp-related">
              <h4 className="bp-related__title">RELATED POSTS</h4>
              <div className="bp-related__list">
                {related.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "1.3rem" }}>No related posts yet.</p>
                ) : (
                  related.map((p) => (
                    <Link key={p.id} href={`/blog/${p.id}`} className="bp-related__item">
                      <div className="bp-related__thumb">
                        <img
                          src={p.coverImage || "/assets/hero.png"}
                          alt={p.title}
                        />
                      </div>
                      <div className="bp-related__info">
                        <span className="bp-related__cat">{p.category}</span>
                        <p className="bp-related__post-title" style={{ fontSize: "1.35rem", fontWeight: 600, color: "#111827" }}>{p.title}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/blog" className="bp-related__view-all">View All Posts</Link>
            </div>
          </aside>
        </div>
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

      {showDeleteModal && (
        <div className="bp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="bp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bp-modal__icon">
              <svg viewBox="0 0 48 48" fill="none" style={{ width: "56px", height: "56px" }}>
                <circle cx="24" cy="24" r="24" fill="#FEE2E2" />
                <path d="M24 16v10M24 32h.02M40 24c0 8.837-7.163 16-16 16S8 32.837 8 24 15.163 8 24 8s16 7.163 16 16z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Delete Blog Post?</h3>
            <p style={{ fontSize: "1.5rem", color: "#6b7280", lineHeight: 1.65, marginBottom: "3rem" }}>Are you sure you want to delete <strong>&quot;{post.title}&quot;</strong>? This cannot be undone.</p>
            <div className="bp-modal__actions" style={{ display: "flex", gap: "1.2rem", justifyContent: "center" }}>
              <button type="button" className="bp-modal__cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="bp-modal__confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
