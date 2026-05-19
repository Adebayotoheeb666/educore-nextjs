"use client";
import { useState } from "react";
import Link from "next/link";
import "../homepage.css";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  authRequired: boolean;
  allowedRoles?: string[];
  requestBody?: string;
  responseSchema: string;
}

const apiEndpoints: Record<string, Endpoint[]> = {
  Authentication: [
    {
      method: "POST",
      path: "/api/v1/auth/login",
      description: "Log in a user and set access session cookies.",
      authRequired: false,
      requestBody: JSON.stringify({ email: "admin@school.ng", password: "password123" }, null, 2),
      responseSchema: JSON.stringify({ success: true, user: { id: "u_1", name: "John Doe", role: "principal" } }, null, 2)
    },
    {
      method: "POST",
      path: "/api/v1/auth/register",
      description: "Register a new school along with its initial owner details and sub-services.",
      authRequired: false,
      requestBody: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        schoolName: "Lagos Academy",
        email: "owner@lagosacademy.ng",
        phoneNumber: "+2348011112222",
        password: "securepassword123",
        selectedServices: ["library", "ai-exams"]
      }, null, 2),
      responseSchema: JSON.stringify({ success: true, message: "School registered successfully!" }, null, 2)
    }
  ],
  "School & Sync": [
    {
      method: "GET",
      path: "/api/v1/sync",
      description: "Retrieve delta database modifications since a specific timestamp for quick offline caching.",
      authRequired: true,
      allowedRoles: ["school_owner", "principal", "student", "parent"],
      responseSchema: JSON.stringify({
        success: true,
        syncTime: "2026-05-18 18:44:00",
        delta: {
          announcements: [],
          classes: [],
          attendance: []
        }
      }, null, 2)
    },
    {
      method: "GET",
      path: "/api/v1/mobile/status",
      description: "Retrieve the global metadata and list of active modules for the user's school.",
      authRequired: true,
      responseSchema: JSON.stringify({
        success: true,
        schoolId: "sch_1",
        schoolName: "Lagos Academy",
        academicSession: "2024/2025",
        currentTerm: "first",
        services: [
          { slug: "core", name: "Academic Core", is_compulsory: 1, status: "active" },
          { slug: "library", name: "Library Hub", is_compulsory: 0, status: "active" }
        ]
      }, null, 2)
    }
  ],
  "Services & Billing": [
    {
      method: "GET",
      path: "/api/v1/services",
      description: "Retrieve all service modules, highlighting the active status for the currently authenticated school.",
      authRequired: true,
      responseSchema: JSON.stringify({
        success: true,
        data: [
          { id: "s_1", name: "AI Exams", slug: "ai-exams", is_compulsory: 0, base_price: 5000, subscription_status: "active" }
        ]
      }, null, 2)
    },
    {
      method: "POST",
      path: "/api/v1/services/subscribe",
      description: "Subscribe the school to an optional service module.",
      authRequired: true,
      allowedRoles: ["school_owner", "principal", "super_admin"],
      requestBody: JSON.stringify({ slug: "ai-exams" }, null, 2),
      responseSchema: JSON.stringify({ success: true, message: "Service 'ai-exams' activated successfully" }, null, 2)
    },
    {
      method: "POST",
      path: "/api/v1/services/unsubscribe",
      description: "Cancel a subscription to an optional service module.",
      authRequired: true,
      allowedRoles: ["school_owner", "principal", "super_admin"],
      requestBody: JSON.stringify({ slug: "ai-exams" }, null, 2),
      responseSchema: JSON.stringify({ success: true, message: "Service 'ai-exams' deactivated successfully" }, null, 2)
    }
  ]
};

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Authentication");

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom sticky-top" style={{ padding: "1rem 0" }}>
        <div className="container-lg d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-primary fs-4" href="/">EduCore AI</Link>
          <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2">
            Mobile API Exposure (v1.0)
          </span>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #ffffff 100%)", padding: "60px 0 40px" }}>
        <div className="container-lg">
          <h1 className="fw-bold" style={{ color: "var(--dark-blue)", fontSize: "2.5rem" }}>Developer Portal</h1>
          <p className="text-muted" style={{ fontSize: "1.1rem", maxWidth: "600px" }}>
            Comprehensive documentation for external integrations and mobile client implementations. All routes support global CORS and auto rate-limiting.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container-lg my-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: "12px", position: "sticky", top: "100px" }}>
              <h5 className="fw-bold text-muted mb-3" style={{ fontSize: "0.9rem", letterSpacing: "0.05em", uppercase: "true" } as any}>CATEGORIES</h5>
              <div className="d-flex flex-column gap-2">
                {Object.keys(apiEndpoints).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="btn text-start px-3 py-2"
                    style={{
                      borderRadius: "8px",
                      background: activeCategory === cat ? "var(--brand-color)" : "transparent",
                      color: activeCategory === cat ? "#fff" : "#475569",
                      fontWeight: activeCategory === cat ? 600 : 500,
                      border: "none",
                      transition: "all 0.2s"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="col-md-9">
            <div className="d-flex flex-column gap-4">
              {apiEndpoints[activeCategory].map((ep, idx) => (
                <div key={idx} className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden" }}>
                  {/* Card Header */}
                  <div className="p-4 border-bottom bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="badge font-monospace"
                        style={{
                          fontSize: "0.9rem",
                          padding: "0.4rem 0.8rem",
                          background: ep.method === "GET" ? "#dbeafe" : ep.method === "POST" ? "#dcfce7" : "#fef3c7",
                          color: ep.method === "GET" ? "#1e40af" : ep.method === "POST" ? "#166534" : "#92400e"
                        }}
                      >
                        {ep.method}
                      </span>
                      <h4 className="font-monospace fw-bold m-0" style={{ color: "var(--dark-blue)", fontSize: "1.1rem" }}>{ep.path}</h4>
                    </div>

                    <div className="d-flex gap-2">
                      <span className={`badge ${ep.authRequired ? "bg-danger bg-opacity-10 text-danger" : "bg-success bg-opacity-10 text-success"}`}>
                        {ep.authRequired ? "Auth Required" : "Public"}
                      </span>
                      {ep.allowedRoles && (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                          Roles: {ep.allowedRoles.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="card-body p-4 bg-white">
                    <p style={{ color: "#475569", fontSize: "1.05rem" }}>{ep.description}</p>

                    {/* Request Schema */}
                    {ep.requestBody && (
                      <div className="mt-4">
                        <h6 className="fw-bold text-muted mb-2">REQUEST BODY</h6>
                        <pre style={{ background: "#0f172a", color: "#38bdf8", padding: "1.2rem", borderRadius: "10px", overflowX: "auto" }}>
                          <code>{ep.requestBody}</code>
                        </pre>
                      </div>
                    )}

                    {/* Response Schema */}
                    <div className="mt-4">
                      <h6 className="fw-bold text-muted mb-2">RESPONSE SCHEMA (200 OK)</h6>
                      <pre style={{ background: "#0f172a", color: "#4ade80", padding: "1.2rem", borderRadius: "10px", overflowX: "auto" }}>
                        <code>{ep.responseSchema}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "var(--dark-blue)", color: "rgba(255,255,255,0.7)", padding: "32px 0", marginTop: "100px" }}>
        <div className="container-lg text-center">
          <span className="fw-bold text-white fs-5 d-block mb-2">EduCore AI</span>
          <span style={{ fontSize: "0.85rem" }}>© {new Date().getFullYear()} — Built for Nigeria's Mobile Ecosystem</span>
        </div>
      </footer>
    </div>
  );
}
