"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OPTIONAL_SERVICES, SERVICE_CATALOG, type ServiceDefinition } from "@/config/services/catalog";
import { invalidateServiceCache } from "@/lib/hooks/useActiveServices";
import { openExternal } from "@/lib/utils/openExternal";
import { authenticatedFetch } from "@/lib/utils/fetch";

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
  academic:      "🎓",
  finance:       "💰",
  communication: "📢",
  library:       "📚",
  ai:            "🤖",
  analytics:     "📊",
  mobile:        "📱",
  backup:        "🛡️",
  core:          "🏫",
};

const CATEGORY_LABELS: Record<string, string> = {
  academic:      "Academic",
  finance:       "Finance",
  communication: "Communication",
  library:       "Library",
  ai:            "AI & Intelligence",
  analytics:     "Analytics",
  mobile:        "Mobile & Sync",
  backup:        "Backup & Recovery",
  core:          "Core (Always Included)",
};

function getServiceName(slug: string): string {
  return SERVICE_CATALOG.find((s) => s.slug === slug)?.name ?? slug;
}

export default function SchoolServicesPage() {
  const [services, setServices]     = useState<ServiceStatus[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionSlug, setActionSlug] = useState<string | null>(null);

  async function load() {
    try {
      const res  = await authenticatedFetch("/api/services");
      const data = await res.json();
      setServices(data.data ?? []);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // slugs currently active for this school
  const activeSlugs = new Set(
    services.filter((s) => s.is_compulsory || s.subscription_status === "active").map((s) => s.slug)
  );

  async function handleToggle(svc: ServiceStatus) {
    const isActive = svc.subscription_status === "active";
    const endpoint = isActive ? "/api/services/unsubscribe" : "/api/services/subscribe";
    setActionSlug(svc.slug);
    try {
      const res  = await authenticatedFetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: svc.slug }),
      });
      const json = await res.json();
      const result = json.data || json; // Unwrap data property if it exists
      
      if (!res.ok) {
        toast.error(result.message ?? json.message ?? "Action failed");
        return;
      }

      // Check if service activation requires payment
      if (result.requiresPayment && !isActive) {
        toast.info(`Redirecting to payment for ${svc.name}...`);
        
        // Initialize payment
        const paymentRes = await authenticatedFetch("/api/services/initialize-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceSlug: svc.slug }),
        });

        const paymentJson = await paymentRes.json();
        const paymentResult = paymentJson.data || paymentJson; // Unwrap data property if it exists
        
        if (!paymentRes.ok) throw new Error(paymentResult.message || paymentJson.message || "Payment initialization failed");

        // Redirect to Paystack (guarded for SSR / WebView)
        if (paymentResult?.authorizationUrl) {
          try {
            await openExternal(paymentResult.authorizationUrl);
          } catch {
            toast.info(`Open this payment link in your browser: ${paymentResult?.authorizationUrl}`);
          }
        } else {
          toast.info(`Open this payment link in your browser: ${paymentResult?.authorizationUrl}`);
        }
        return;
      }

      // Service activated successfully without payment
      if (result.activated && !isActive) {
        toast.success(result.message ?? `Service activated`);
      } else if (isActive) {
        toast.success(result.message ?? `Service deactivated`);
      }
      
      invalidateServiceCache();
      await load();
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setActionSlug(null);
    }
  }

  const compulsory = services.filter((s) => s.is_compulsory);
  const optional   = services.filter((s) => !s.is_compulsory);

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
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.4rem" }}>⏳ Loading services…</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Services &amp; Modules</h1>
          <p className="page-subtitle">Manage which features are active for your school. Changes take effect immediately.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 700, fontSize: "1.8rem", color: "#6A5ACD", margin: 0 }}>
            ₦{monthlyTotal.toLocaleString()}
            <span style={{ fontSize: "1.2rem", fontWeight: 400, color: "var(--text-muted)" }}>/month</span>
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "1.2rem", color: "var(--text-muted)" }}>
            {optional.filter((s) => s.subscription_status === "active").length} optional module{optional.filter((s) => s.subscription_status === "active").length !== 1 ? "s" : ""} active
          </p>
        </div>
      </div>

      {/* Core services */}
      <div style={{
        background:    "#f0fdf4",
        border:        "1.5px solid #bbf7d0",
        borderRadius:  14,
        padding:       "2rem 2rem 1.5rem",
        marginBottom:  "3rem",
      }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.4rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#166534" }}>
          ✅ Core Services — Always Included Free
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
          {compulsory.map((svc) => (
            <div key={svc.id} style={{
              background: "#fff", borderRadius: 10, padding: "1rem 1.4rem",
              border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "0.8rem",
            }}>
              <span style={{ fontSize: "1.8rem" }}>✓</span>
              <div>
                <p style={{ fontWeight: 700, margin: 0, color: "#166534", fontSize: "1.25rem" }}>{svc.name}</p>
                <p style={{ margin: 0, color: "#4ade80", fontSize: "1.05rem" }}>Always active · Free</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional services by category */}
      {Object.entries(optionalByCategory).map(([cat, svcs]) => (
        <div key={cat} style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {CATEGORY_ICONS[cat] ?? "🔧"} {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.4rem" }}>
            {svcs.map((svc) => {
              const isActive   = svc.subscription_status === "active";
              const busy       = actionSlug === svc.slug;
              const catalogSvc = OPTIONAL_SERVICES.find((s) => s.slug === svc.slug);
              const deps       = catalogSvc?.dependencies ?? [];

              // Deps that are OPTIONAL (compulsory ones are always active)
              const optionalDeps = deps.filter((d) =>
                OPTIONAL_SERVICES.some((s) => s.slug === d)
              );
              const missingDeps = optionalDeps.filter((d) => !activeSlugs.has(d));
              const canActivate = missingDeps.length === 0;

              // Services that depend on THIS service (active ones)
              const activeDependent = services.filter((s) => {
                if (!s.subscription_status === true) return false;
                const cat2 = OPTIONAL_SERVICES.find((x) => x.slug === s.slug);
                return cat2?.dependencies.includes(svc.slug) && s.subscription_status === "active";
              });

              return (
                <div
                  key={svc.id}
                  style={{
                    borderRadius: 14,
                    border:       `2px solid ${isActive ? "#6A5ACD" : "#e2e8f0"}`,
                    background:   isActive ? "#f3f0ff" : "#fff",
                    padding:      "1.8rem",
                    display:      "flex",
                    flexDirection:"column",
                    gap:          "0.8rem",
                    transition:   "border-color 0.15s, box-shadow 0.15s",
                    boxShadow:    isActive ? "0 4px 20px rgba(106,90,205,0.10)" : "none",
                  }}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <p style={{ fontWeight: 700, margin: 0, color: isActive ? "#6A5ACD" : "#1e293b", fontSize: "1.4rem", flex: 1 }}>
                      {svc.name}
                    </p>
                    <span style={{
                      padding:      "0.25rem 0.8rem",
                      borderRadius: 20,
                      fontSize:     "1.05rem",
                      fontWeight:   700,
                      whiteSpace:   "nowrap",
                      background:   isActive ? "#6A5ACD" : "#f1f5f9",
                      color:        isActive ? "#fff" : "#64748b",
                    }}>
                      {isActive ? "● Active" : "○ Inactive"}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1.5 }}>
                    {svc.description}
                  </p>

                  {/* Dependencies */}
                  {deps.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {deps.map((dep) => {
                        const depActive = activeSlugs.has(dep);
                        return (
                          <span key={dep} style={{
                            padding:      "0.2rem 0.7rem",
                            borderRadius: 20,
                            fontSize:     "1.05rem",
                            fontWeight:   600,
                            background:   depActive ? "#dcfce7" : "#fee2e2",
                            color:        depActive ? "#166534" : "#dc2626",
                            border:       `1px solid ${depActive ? "#bbf7d0" : "#fecaca"}`,
                          }}>
                            {depActive ? "✓" : "✗"} {getServiceName(dep)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Missing deps warning */}
                  {!isActive && missingDeps.length > 0 && (
                    <div style={{
                      background:   "#fff7ed",
                      border:       "1px solid #fed7aa",
                      borderRadius: 8,
                      padding:      "0.8rem 1rem",
                      fontSize:     "1.15rem",
                      color:        "#9a3412",
                    }}>
                      ⚠️ First activate: <strong>{missingDeps.map(getServiceName).join(", ")}</strong>
                    </div>
                  )}

                  {/* Dependent services warning (shown when about to deactivate) */}
                  {isActive && activeDependent.length > 0 && (
                    <div style={{
                      background:   "#fef9c3",
                      border:       "1px solid #fde047",
                      borderRadius: 8,
                      padding:      "0.8rem 1rem",
                      fontSize:     "1.15rem",
                      color:        "#713f12",
                    }}>
                      ℹ️ Deactivating will also affect: <strong>{activeDependent.map((s) => s.name).join(", ")}</strong>
                    </div>
                  )}

                  {/* Price + action */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.5rem" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: isActive ? "#6A5ACD" : "#475569", fontSize: "1.5rem" }}>
                      {svc.base_price === 0 ? "Free" : `₦${svc.base_price.toLocaleString()}/mo`}
                    </p>
                    <button
                      onClick={() => handleToggle(svc)}
                      disabled={busy || (!isActive && !canActivate)}
                      title={!isActive && !canActivate ? `Requires: ${missingDeps.map(getServiceName).join(", ")}` : undefined}
                      style={{
                        padding:      "0.65rem 1.5rem",
                        borderRadius: 8,
                        border:       "none",
                        cursor:       busy || (!isActive && !canActivate) ? "not-allowed" : "pointer",
                        fontWeight:   700,
                        fontSize:     "1.25rem",
                        background:   isActive ? "#fee2e2" : (!canActivate ? "#f1f5f9" : "#6A5ACD"),
                        color:        isActive ? "#dc2626" : (!canActivate ? "#94a3b8" : "#fff"),
                        opacity:      busy ? 0.7 : 1,
                        transition:   "all 0.15s",
                      }}
                    >
                      {busy ? "…" : isActive ? "Deactivate" : (!canActivate ? "Locked 🔒" : "Activate")}
                    </button>
                  </div>

                  {/* Since label */}
                  {svc.subscribed_at && (
                    <p style={{ margin: 0, fontSize: "1.05rem", color: "#94a3b8" }}>
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
