"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OPTIONAL_SERVICES, type ServiceDefinition } from "@/config/services/catalog";

interface ServiceStatus {
  id: string;
  slug: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
  is_compulsory: number;
  subscription_status: string | null;
  subscribed_at: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  academic: "🎓",
  finance: "💰",
  communication: "📢",
  library: "📚",
  ai: "🤖",
  analytics: "📊",
  mobile: "📱",
  core: "🏫",
};

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  finance: "Finance",
  communication: "Communication",
  library: "Library",
  ai: "AI & Intelligence",
  analytics: "Analytics",
  mobile: "Mobile & Sync",
  core: "Core (Always Included)",
};

export default function SchoolServicesPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSlug, setActionSlug] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/services", { credentials: "include" });
      const data = await res.json();
      setServices(data.data ?? []);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(svc: ServiceStatus) {
    const isActive = svc.subscription_status === "active";
    const endpoint = isActive ? "/api/services/unsubscribe" : "/api/services/subscribe";
    setActionSlug(svc.slug);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug: svc.slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Action failed");
        return;
      }
      toast.success(data.data?.message ?? (isActive ? "Service deactivated" : "Service activated"));
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setActionSlug(null);
    }
  }

  const compulsory = services.filter((s) => s.is_compulsory);
  const optional = services.filter((s) => !s.is_compulsory);

  const optionalByCategory = optional.reduce<Record<string, ServiceStatus[]>>((acc, svc) => {
    const cat = svc.category === "core" ? "academic" : svc.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const monthlyTotal = optional
    .filter((s) => s.subscription_status === "active")
    .reduce((sum, s) => sum + s.base_price, 0);

  if (loading) {
    return <div className="page-content"><p>Loading services...</p></div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services & Modules</h1>
          <p className="page-subtitle">Manage which features are active for your school. Changes take effect immediately.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 700, fontSize: "1.6rem", color: "#6A5ACD", margin: 0 }}>
            ₦{monthlyTotal.toLocaleString()}<span style={{ fontSize: "1.2rem", fontWeight: 400, color: "#64748b" }}>/month</span>
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "1.2rem", color: "#64748b" }}>
            {optional.filter((s) => s.subscription_status === "active").length} optional services active
          </p>
        </div>
      </div>

      {/* Compulsory services */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "2rem", marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#166534" }}>
          ✅ Core Services — Always Included Free
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {compulsory.map((svc) => (
            <div key={svc.id} style={{ background: "#fff", borderRadius: 8, padding: "1rem 1.2rem", border: "1px solid #bbf7d0" }}>
              <p style={{ fontWeight: 700, margin: "0 0 0.3rem", color: "#166534", fontSize: "1.3rem" }}>{svc.name}</p>
              <p style={{ margin: 0, color: "#4ade80", fontSize: "1.1rem" }}>Active · Free</p>
            </div>
          ))}
        </div>
      </div>

      {/* Optional services by category */}
      {Object.entries(optionalByCategory).map(([cat, svcs]) => (
        <div key={cat} style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {CATEGORY_ICONS[cat] ?? "🔧"} {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem" }}>
            {svcs.map((svc) => {
              const isActive = svc.subscription_status === "active";
              const busy = actionSlug === svc.slug;
              const catalogSvc = OPTIONAL_SERVICES.find((s) => s.slug === svc.slug);
              const deps = catalogSvc?.dependencies ?? [];

              return (
                <div
                  key={svc.id}
                  style={{
                    borderRadius: 12,
                    border: `2px solid ${isActive ? "#6A5ACD" : "#e2e8f0"}`,
                    background: isActive ? "#f3f0ff" : "#fff",
                    padding: "1.6rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontWeight: 700, margin: 0, color: isActive ? "#6A5ACD" : "#1e293b", fontSize: "1.4rem" }}>{svc.name}</p>
                    <span style={{
                      padding: "0.2rem 0.8rem",
                      borderRadius: 20,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      background: isActive ? "#6A5ACD" : "#f1f5f9",
                      color: isActive ? "#fff" : "#64748b",
                    }}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p style={{ margin: 0, color: "#64748b", fontSize: "1.2rem", lineHeight: 1.5 }}>{svc.description}</p>

                  {deps.length > 0 && (
                    <p style={{ margin: 0, fontSize: "1.1rem", color: "#94a3b8" }}>
                      Requires: {deps.join(", ")}
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: isActive ? "#6A5ACD" : "#475569", fontSize: "1.4rem" }}>
                      {svc.base_price === 0 ? "Free" : `₦${svc.base_price.toLocaleString()}/mo`}
                    </p>
                    <button
                      onClick={() => handleToggle(svc)}
                      disabled={busy}
                      style={{
                        padding: "0.6rem 1.4rem",
                        borderRadius: 8,
                        border: "none",
                        cursor: busy ? "wait" : "pointer",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        background: isActive ? "#fee2e2" : "#6A5ACD",
                        color: isActive ? "#dc2626" : "#fff",
                        opacity: busy ? 0.7 : 1,
                      }}
                    >
                      {busy ? "..." : isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>

                  {svc.subscribed_at && (
                    <p style={{ margin: 0, fontSize: "1.1rem", color: "#94a3b8" }}>
                      Active since {new Date(svc.subscribed_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
