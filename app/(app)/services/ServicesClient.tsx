"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { OPTIONAL_SERVICES, type ServiceDefinition } from "@/config/services/catalog";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { openExternal } from "@/lib/utils/openExternal";

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  finance: "Finance",
  communication: "Communication",
  library: "Library",
  ai: "AI & Intelligence",
  analytics: "Analytics",
  mobile: "Mobile & Sync",
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: "🎓",
  finance: "💰",
  communication: "📢",
  library: "📚",
  ai: "🤖",
  analytics: "📊",
  mobile: "📱",
};

export default function ServicesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Handle payment verification on page load
  useEffect(() => {
    const reference = searchParams.get("reference");
    const status = searchParams.get("status");

    if (reference && status === "success") {
      verifyServicePayment(reference);
    }
  }, [searchParams]);

  const verifyServicePayment = async (reference: string) => {
    setVerifyingPayment(true);
    try {
      const res = await authenticatedFetch(`/api/services/verify-payment?reference=${reference}`);

      const json = await res.json();
      const result = json.data || json; // Unwrap data property if it exists
      
      if (!res.ok) throw new Error(result.message || json.message || "Payment verification failed");

      if (result.verified && result.status === "success") {
        toast.success("Service activated successfully! Payment confirmed.");
        // Reload services list
        loadServices();
        // Clean up URL
        router.replace("/services");
      } else {
        throw new Error(`Payment verification failed: ${result.status}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Payment verification failed");
      router.replace("/services");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await authenticatedFetch("/api/services");
      const data = await response.json();
      if (data.data) {
        const activeSlugs = data.data
          .filter((s: any) => s.subscription_status === "active" || s.is_compulsory)
          .map((s: any) => s.slug);
        setActiveServices(new Set(activeSlugs));
      }
    } catch {
      toast.error("Failed to load services");
    }
  };

  useEffect(() => {
    loadServices().finally(() => setLoading(false));
  }, []);

  const handleToggle = async (svc: ServiceDefinition) => {
    if (svc.is_compulsory) return; // Cannot toggle compulsory

    const isSubscribed = activeServices.has(svc.slug);
    setUpdating(svc.slug);

    try {
      const endpoint = isSubscribed ? "/api/services/unsubscribe" : "/api/services/subscribe";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: svc.slug }),
        credentials: "include"
      });

      const json = await res.json();
      const result = json.data || json; // Unwrap data property if it exists
      
      if (!res.ok) throw new Error(result.message || json.message || "Failed to update service");

      // Check if service activation requires payment
      if (result.requiresPayment && !isSubscribed) {
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

        // Redirect to Paystack using a mobile-friendly URL opener
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
      if (result.activated && !isSubscribed) {
        setActiveServices(prev => {
          const next = new Set(prev);
          next.add(svc.slug);
          return next;
        });
        toast.success(result.message || `Successfully activated ${svc.name}`);
      } else if (isSubscribed) {
        setActiveServices(prev => {
          const next = new Set(prev);
          next.delete(svc.slug);
          return next;
        });
        toast.success(result.message || `Successfully unsubscribed from ${svc.name}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading services...</div>;

  const servicesByCategory = OPTIONAL_SERVICES.reduce<Record<string, ServiceDefinition[]>>(
    (acc, svc) => {
      const cat = svc.category === "core" ? "academic" : svc.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(svc);
      return acc;
    },
    {}
  );

  return (
    <div>
      {Object.entries(servicesByCategory).map(([cat, services]) => (
        <div key={cat} style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {CATEGORY_ICONS[cat] ?? "🔧"} {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {services.map((svc) => {
              const active = activeServices.has(svc.slug);
              const isUpdating = updating === svc.slug;
              
              return (
                <div
                  key={svc.slug}
                  style={{
                    padding: "1.5rem",
                    borderRadius: 12,
                    border: `2px solid ${active ? "var(--brand-color)" : "#e2e8f0"}`,
                    background: active ? "#f3f0ff" : "#fff",
                    position: "relative",
                  }}
                >
                  <p style={{ fontWeight: 700, margin: "0 0 0.4rem", color: active ? "var(--brand-color)" : "#1e293b", fontSize: "1.3rem" }}>{svc.name}</p>
                  <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "1.1rem", lineHeight: 1.4 }}>{svc.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: active ? "var(--brand-color)" : "#475569", fontSize: "1.2rem" }}>
                      {svc.base_price === 0 ? "Free" : `₦${svc.base_price.toLocaleString()}/mo`}
                    </p>
                    {svc.is_compulsory ? (
                      <span style={{ fontSize: "1rem", color: "#16a34a", fontWeight: 600 }}>Included</span>
                    ) : (
                      <button 
                        className={`btn-dashboard-${active ? 'outline' : 'primary'}`}
                        style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
                        onClick={() => handleToggle(svc)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "..." : (active ? "Manage" : "Add Module")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
