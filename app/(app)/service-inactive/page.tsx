"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OPTIONAL_SERVICES } from "@/config/services/catalog";

const SLUG_TO_LABEL: Record<string, string> = {
  subjects:       "Subject Management",
  attendance:     "Attendance Tracking",
  exams:          "Exam Management",
  results:        "Result Management",
  "lesson-plans": "Lesson Planning",
  timetable:      "Timetable Management",
  fees:           "Fee Management",
  payments:       "Online Payments",
  announcements:  "Announcements",
  feedback:       "Feedback System",
  blog:           "School Blog",
  calendar:       "Academic Calendar",
  library:        "Library Management",
  behavior:       "Behavior Tracking",
  analytics:      "Analytics & Reports",
  ai:             "AI Features",
  sync:           "Offline Sync",
};

function ServiceInactiveContent() {
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";
  const svc = OPTIONAL_SERVICES.find((s) => s.slug === slug);
  const label = svc?.name ?? SLUG_TO_LABEL[slug] ?? slug;
  const price = svc?.base_price ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(106,90,205,0.12)",
          padding: "4rem 3.5rem",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6A5ACD, #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.8rem",
            margin: "0 auto 2rem",
          }}
        >
          🔒
        </div>

        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            color: "#1e293b",
            margin: "0 0 1rem",
          }}
        >
          Service Not Active
        </h1>

        <p
          style={{
            fontSize: "1.4rem",
            color: "#64748b",
            lineHeight: 1.6,
            margin: "0 0 0.6rem",
          }}
        >
          <strong style={{ color: "#6A5ACD" }}>{label}</strong> is not currently
          activated for your school.
        </p>

        {svc?.description && (
          <p
            style={{
              fontSize: "1.3rem",
              color: "#94a3b8",
              margin: "0 0 2rem",
              lineHeight: 1.5,
            }}
          >
            {svc.description}
          </p>
        )}

        {/* Price badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#f3f0ff",
            border: "1.5px solid #c4b5fd",
            borderRadius: 50,
            padding: "0.5rem 1.4rem",
            marginBottom: "2.5rem",
          }}
        >
          <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#6A5ACD" }}>
            {price === 0 ? "Free" : `₦${price.toLocaleString()}/month`}
          </span>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link
            href="/school/services"
            style={{
              display: "block",
              padding: "1.1rem 2rem",
              borderRadius: 10,
              background: "linear-gradient(135deg, #6A5ACD, #7c3aed)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.4rem",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            ✨ Activate {label}
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: "block",
              padding: "1rem 2rem",
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              color: "#475569",
              fontWeight: 600,
              fontSize: "1.3rem",
              textDecoration: "none",
              background: "#f8fafc",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <p
          style={{
            marginTop: "2rem",
            fontSize: "1.2rem",
            color: "#94a3b8",
          }}
        >
          You can manage all your services from{" "}
          <Link href="/school/services" style={{ color: "#6A5ACD", fontWeight: 600 }}>
            School → Services
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function ServiceInactivePage() {
  return (
    <Suspense fallback={null}>
      <ServiceInactiveContent />
    </Suspense>
  );
}
