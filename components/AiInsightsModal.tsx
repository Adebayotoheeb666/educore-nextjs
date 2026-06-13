"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

function EmailSubscribeForm() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const validate = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!validate(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ai/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setMessage('Thanks — you are subscribed.');
        setEmail('');
      } else {
        setMessage(data?.message || 'Subscription failed.');
      }
    } catch (err) {
      setMessage('Subscription failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="subscribe-input"
          aria-label="Email address"
        />
        <button className="btn-primary subscribe-submit" disabled={submitting}>
          {submitting ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && <p className="subscribe-message">{message}</p>}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AiInsightsModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [cachedFlag, setCachedFlag] = useState(false);
  const [useCache, setUseCache] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    setMounted(open);
    if (!open) return;
    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    fetchInsights();
  }, [open]);

  async function fetchInsights(bustCache = false) {
    setLoading(true);
    setCachedFlag(false);
    try {
      const url = `/api/ai/insights${bustCache || !useCache ? '?bust=1' : ''}`;
      const r = await fetch(url);
      const json = await r.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      setInsights(data);
      setCachedFlag(Boolean(json?.cached));
      setLastUpdated(Date.now());
    } catch (e) {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  // ESC to close and focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // focus the container
    const timer = setTimeout(() => containerRef.current?.focus(), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // restore focus to previous element when closing
  useEffect(() => {
    if (!open && prevFocusedRef.current) {
      try { prevFocusedRef.current.focus(); } catch {}
    }
  }, [open]);

  if (!open && !mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Insights"
      className="ai-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className={`ai-modal-panel ${open ? "open" : ""}`}
      >
        <div className="ai-modal-header">
          <div>
            <span className="ai-modal-badge">AI Insights</span>
            <h2>Supercharge school planning with generative support</h2>
            <p>Latest guides, templates and actionable AI recommendations for schools.</p>
          </div>
          <button className="ai-close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="ai-modal-grid">
          <div className="ai-modal-main">
            <section className="ai-card highlight-card">
              <div className="card-toprow">
                <div>
                  <p className="eyebrow">Featured AI Guides</p>
                  <h3>What educators are using now</h3>
                </div>
              </div>
              <div className="resource-preview">
                <iframe src="/resources" title="Knowledge Hub" />
              </div>
              <div className="resource-links">
                <Link href="/resources">AI & Teaching — Lesson planning with AI</Link>
                <Link href="/resources">AI-driven Assessments</Link>
                <Link href="/resources">Digital Transformation Guide</Link>
              </div>
            </section>

            <section className="ai-card insight-card">
              <div className="card-toprow">
                <div>
                  <p className="eyebrow">Quick Insights</p>
                  <h3>AI recommendations for every school day</h3>
                </div>
                <div className="action-group">
                  <button onClick={() => fetchInsights(true)} className="btn-secondary" aria-label="Refresh insights" disabled={loading}>
                    {loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                  <button onClick={() => {
                    const text = insights.join('\n');
                    try { navigator.clipboard.writeText(text); } catch {}
                  }} className="btn-secondary">Copy</button>
                </div>
              </div>

              <div className="insight-meta">
                <label className="cache-toggle">
                  <input type="checkbox" checked={useCache} onChange={(e) => setUseCache(e.target.checked)} />
                  Use cache
                </label>
                <span className={`status-pill ${cachedFlag ? 'cached' : 'live'}`} aria-live="polite">
                  {cachedFlag ? 'Cached insights' : (lastUpdated ? 'Live insights' : 'Preview')}
                </span>
              </div>

              <div className="ai-insight-list">
                {insights.length > 0 ? (
                  insights.map((text, index) => (
                    <div key={index} className="ai-insight-item" style={{ animationDelay: `${index * 80}ms` }}>
                      <span className="item-badge">✨</span>
                      <p>{text}</p>
                    </div>
                  ))
                ) : (
                  [
                    'Use AI to generate differentiated lesson plans by ability.',
                    'Automate objective marking to save teacher time.',
                    'Summarize student progress for parent updates.',
                  ].map((text, index) => (
                    <div key={index} className="ai-insight-item fallback-item" style={{ animationDelay: `${index * 80}ms` }}>
                      <span className="item-badge">💡</span>
                      <p>{text}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="ai-card explore-card">
              <div>
                <p className="eyebrow">Explore</p>
                <h3>Full Knowledge Hub</h3>
                <p>Open guided walkthroughs, templates and downloads to bring AI into school workflows.</p>
              </div>
              <Link href="/resources" className="btn-primary">Open Knowledge Hub</Link>
            </section>
          </div>

          <aside className="ai-modal-aside">
            <div className="ai-card subscribe-card">
              <div>
                <p className="eyebrow">Subscribe</p>
                <h4>Get AI insights in your inbox</h4>
                <p>Fresh practical ideas delivered weekly for teachers and administrators.</p>
              </div>
              <EmailSubscribeForm />
            </div>

            <div className="ai-card about-card">
              <p className="eyebrow">About AI Insights</p>
              <h4>Curated for schools</h4>
              <p>Practical recommendations, templates, and admin workflows designed to improve teaching, planning, and parent communication.</p>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .ai-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1200;
        }

        .ai-modal-panel {
          width: 100%;
          max-width: 980px;
          max-height: calc(100vh - 3rem);
          overflow-y: auto;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,255,0.96));
          padding: 1.5rem;
          box-shadow: 0 36px 80px rgba(15, 23, 42, 0.24);
          transform: translateY(12px);
          opacity: 0;
          transition: opacity 220ms ease, transform 220ms ease;
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .ai-modal-panel.open {
          transform: translateY(0);
          opacity: 1;
        }

        .ai-modal-header {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .ai-modal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #4338ca;
          background: rgba(106, 90, 205, 0.1);
          padding: 0.45rem 0.85rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .ai-modal-header h2 {
          font-size: clamp(1.7rem, 2.2vw, 2.25rem);
          line-height: 1.08;
          margin-bottom: 0.5rem;
        }

        .ai-modal-header p {
          color: #475569;
          max-width: 620px;
          line-height: 1.75;
        }

        .ai-close-button {
          border: none;
          background: #f8fafc;
          width: 44px;
          height: 44px;
          border-radius: 100px;
          font-size: 1.45rem;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .ai-close-button:hover {
          transform: scale(1.05);
          background: #eef2ff;
        }

        .ai-modal-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 1rem;
        }

        .ai-modal-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ai-modal-aside {
          display: grid;
          gap: 1rem;
        }

        .ai-card {
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 22px;
          padding: 1.4rem;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        }

        .highlight-card {
          padding: 1.2rem;
          background: linear-gradient(180deg, #eef2ff 0%, #f8faff 100%);
          border-color: rgba(99, 102, 241, 0.24);
        }

        .explore-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }

        .subscribe-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .about-card {
          background: #f8fafc;
          color: #0f172a;
        }

        .card-toprow {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .eyebrow {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4338ca;
        }

        h3 {
          font-size: 1.35rem;
          margin: 0;
          line-height: 1.3;
        }

        .resource-preview {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.18);
          height: 220px;
          margin-bottom: 1rem;
        }

        .resource-preview iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .resource-links {
          display: grid;
          gap: 0.65rem;
        }

        .resource-links a {
          display: block;
          color: #1d4ed8;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .resource-links a:hover {
          color: #4338ca;
        }

        .action-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .insight-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cache-toggle {
          display: inline-flex;
          gap: 0.75rem;
          align-items: center;
          color: #64748b;
          font-size: 0.95rem;
        }

        .cache-toggle input {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          background: #e2e8f0;
        }

        .status-pill.cached {
          background: rgba(34, 197, 94, 0.16);
          color: #166534;
        }

        .status-pill.live {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .ai-insight-list {
          display: grid;
          gap: 0.9rem;
        }

        .ai-insight-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.95rem;
          align-items: flex-start;
          padding: 1rem 1rem 1rem 0.95rem;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.16);
          opacity: 0;
          transform: translateY(10px);
          animation: slideUp 280ms ease forwards;
        }

        .fallback-item {
          background: #ffffff;
          border-color: rgba(148, 163, 184, 0.12);
        }

        .item-badge {
          display: inline-flex;
          width: 2.4rem;
          height: 2.4rem;
          align-items: center;
          justify-content: center;
          border-radius: 100px;
          background: #eef2ff;
          color: #4338ca;
          font-size: 1rem;
          margin-top: 0.15rem;
        }

        .ai-insight-item p {
          margin: 0;
          color: #0f172a;
          line-height: 1.7;
          font-size: 1rem;
        }

        .ai-modal-panel p {
          color: #475569;
        }

        .ai-modal-card h4 {
          margin: 0.5rem 0 0.75rem;
          font-size: 1.05rem;
          line-height: 1.4;
        }

        .ai-modal-card p {
          margin: 0;
          color: #475569;
          line-height: 1.7;
        }

        .subscribe-input {
          width: 100%;
          padding: 0.95rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #f8fafc;
          color: #0f172a;
          font-size: 1rem;
          outline: none;
          margin-bottom: 1rem;
        }

        .subscribe-input:focus {
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
        }

        .subscribe-submit {
          width: 100%;
          justify-content: center;
        }

        .subscribe-message {
          margin-top: 0.85rem;
          color: #334155;
          font-size: 0.95rem;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 980px) {
          .ai-modal-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ai-modal-panel {
            padding: 1rem;
            border-radius: 18px;
          }

          .ai-modal-header {
            flex-direction: column;
            align-items: stretch;
          }

          .card-toprow {
            flex-direction: column;
            align-items: stretch;
          }

          .action-group {
            justify-content: stretch;
          }

          .btn-secondary,
          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
