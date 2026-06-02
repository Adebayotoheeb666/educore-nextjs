"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface School {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  state?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_expires_at?: string;
  ai_token_budget?: number;
  used_ai_tokens?: number;
  created_at: string;
  student_count?: number;
  teacher_count?: number;
}

const PLANS = ["basic", "standard", "premium", "enterprise"];
const STATUSES = ["trial", "active", "inactive", "suspended", "cancelled"];
const PAGE_SIZE = 20;

function statusBadgeClass(s?: string) {
  if (s === "active") return "badge-green";
  if (s === "trial") return "badge-blue";
  if (s === "suspended" || s === "cancelled") return "badge-red";
  return "badge-gray";
}

interface SubscriptionModalProps {
  school: School;
  onClose: () => void;
  onSaved: (updated: School) => void;
}

function SubscriptionModal({ school, onClose, onSaved }: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<"subscription" | "services">("subscription");
  const [form, setForm] = useState({
    status: school.subscription_status ?? "trial",
    plan: school.subscription_plan ?? "basic",
    aiTokenBudget: String(school.ai_token_budget ?? 100000),
    usedAiTokens: String(school.used_ai_tokens ?? 0),
    expiresAt: school.subscription_expires_at
      ? new Date(school.subscription_expires_at).toISOString().slice(0, 10)
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceActionSlug, setServiceActionSlug] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await authenticatedFetch(`/api/admin/schools/${school.id}/services`);
      const data = await res.json();
      if (res.ok) {
        setServices(data.data?.services ?? []);
      } else {
        toast.error(data.message ?? "Failed to load services");
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (activeTab === "services") {
      fetchServices();
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authenticatedFetch(`/api/school/admin/schools/${school.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          plan: form.plan,
          aiTokenBudget: Number(form.aiTokenBudget) || null,
          usedAiTokens: Number(form.usedAiTokens) || null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to update");
      toast.success(`${school.name} subscription updated`);
      onSaved(data.data as School);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleService = async (slug: string, currentActive: boolean) => {
    const action = currentActive ? "deactivate" : "activate";
    setServiceActionSlug(slug);
    try {
      const res = await authenticatedFetch(`/api/admin/schools/${school.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Action failed");
        return;
      }
      toast.success(data.message ?? `Service updated successfully`);
      fetchServices();
    } catch {
      toast.error("Network error");
    } finally {
      setServiceActionSlug(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "2rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: "3rem",
        width: "100%", maxWidth: activeTab === "services" ? 720 : 520,
        maxHeight: "90vh", overflowY: "auto", transition: "max-width 0.2s ease-in-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.8rem", fontWeight: 800 }}>
              Manage School Settings
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "1.3rem" }}>{school.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem", gap: "1.5rem" }}>
          <button
            onClick={() => setActiveTab("subscription")}
            style={{
              padding: "0.8rem 0.2rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "subscription" ? "2px solid #6A5ACD" : "2px solid transparent",
              color: activeTab === "subscription" ? "#6A5ACD" : "#64748b",
              fontWeight: 700,
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            Subscription Details
          </button>
          <button
            onClick={() => setActiveTab("services")}
            style={{
              padding: "0.8rem 0.2rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "services" ? "2px solid #6A5ACD" : "2px solid transparent",
              color: activeTab === "services" ? "#6A5ACD" : "#64748b",
              fontWeight: 700,
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            School Services
          </button>
        </div>

        {activeTab === "subscription" ? (
          <>
            {/* School stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
              {[
                { label: "Students", value: school.student_count ?? "—" },
                { label: "Teachers", value: school.teacher_count ?? "—" },
                { label: "AI Used", value: school.used_ai_tokens != null ? `${((school.used_ai_tokens / (school.ai_token_budget || 1)) * 100).toFixed(0)}%` : "—" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center", padding: "1rem", background: "#f8fafc", borderRadius: 8 }}>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.2rem", color: "#1e293b" }}>{stat.value}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", color: "#64748b" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid-2" style={{ marginBottom: "2rem" }}>
                <div className="form-group">
                  <label>Subscription Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}>
                    {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>AI Token Budget</label>
                  <input
                    type="number"
                    value={form.aiTokenBudget}
                    onChange={(e) => setForm((p) => ({ ...p, aiTokenBudget: e.target.value }))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label>Used AI Tokens</label>
                  <input
                    type="number"
                    value={form.usedAiTokens}
                    onChange={(e) => setForm((p) => ({ ...p, usedAiTokens: e.target.value }))}
                    min={0}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "2.5rem" }}>
                <label>Subscription Expires</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>

              {/* Status colour hint */}
              {form.status === "suspended" && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "1rem 1.2rem", marginBottom: "1.5rem" }}>
                  <p style={{ margin: 0, fontSize: "1.3rem", color: "#dc2626" }}>
                    ⚠️ Suspending will prevent all school users from accessing the platform.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "1.2rem" }}>
              Manually activate or deactivate modules for this school. Super Admin overrides will apply instantly.
            </p>
            {loadingServices ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b", fontSize: "1.3rem" }}>
                Loading services…
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {services.map((svc) => {
                  const isActive = svc.subscription_status === "active";
                  const isCompulsory = Boolean(svc.is_compulsory);
                  const isBusy = serviceActionSlug === svc.slug;

                  return (
                    <div
                      key={svc.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1.2rem 1.5rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        background: isActive ? "#f8fafd" : "#fff",
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "1.3rem", color: "#1e293b" }}>{svc.name}</span>
                          <span
                            style={{
                              fontSize: "1rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: 12,
                              fontWeight: 700,
                              background: isCompulsory ? "#dcfce7" : (isActive ? "#e0f2fe" : "#f1f5f9"),
                              color: isCompulsory ? "#15803d" : (isActive ? "#0369a1" : "#475569"),
                            }}
                          >
                            {isCompulsory ? "Core Service" : (isActive ? "Active" : "Inactive")}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "1.15rem", lineHeight: 1.4 }}>{svc.description}</p>
                      </div>
                      <div>
                        {isCompulsory ? (
                          <span style={{ fontSize: "1.15rem", color: "#16a34a", fontWeight: 600 }}>Included</span>
                        ) : (
                          <button
                            onClick={() => handleToggleService(svc.slug, isActive)}
                            disabled={isBusy}
                            style={{
                              padding: "0.5rem 1.2rem",
                              borderRadius: 6,
                              border: "none",
                              cursor: isBusy ? "wait" : "pointer",
                              fontWeight: 700,
                              fontSize: "1.15rem",
                              background: isActive ? "#fee2e2" : "#6A5ACD",
                              color: isActive ? "#dc2626" : "#fff",
                              transition: "opacity 0.15s",
                              opacity: isBusy ? 0.7 : 1,
                            }}
                          >
                            {isBusy ? "…" : (isActive ? "Deactivate" : "Activate")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "0.8rem 2rem" }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [managing, setManaging] = useState<School | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/admin/schools")
      .then((r) => r.json())
      .then((d) => setSchools(Array.isArray(d.data) ? d.data : d.data?.schools ?? []))
      .catch(() => toast.error("Failed to load schools"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return schools.filter((s) => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.subscription_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schools, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSaved(updated: School) {
    setSchools((prev) => prev.map((s) => s.id === updated.id ? { ...s, ...updated } : s));
    setManaging(null);
  }

  // Summary counts
  const activeCnt = schools.filter((s) => s.subscription_status === "active").length;
  const trialCnt = schools.filter((s) => s.subscription_status === "trial").length;
  const suspendedCnt = schools.filter((s) => s.subscription_status === "suspended" || s.subscription_status === "cancelled").length;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>All Schools</h1>
          <p>Platform-wide list of all registered schools and their subscriptions.</p>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {[
            { label: "Total Schools", value: schools.length, color: "#6A5ACD", bg: "#f3f0ff" },
            { label: "Active", value: activeCnt, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Trial", value: trialCnt, color: "#2563eb", bg: "#eff6ff" },
            { label: "Suspended / Cancelled", value: suspendedCnt, color: "#dc2626", bg: "#fef2f2" },
          ].map((c) => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "1.5rem 2rem" }}>
              <p style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 0.3rem", color: c.color }}>{c.value}</p>
              <p style={{ margin: 0, fontSize: "1.3rem", color: "#64748b" }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search school name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading schools…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">No schools found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>Email</th>
                <th>State</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Students</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ color: "#64748b" }}>{s.email ?? "—"}</td>
                  <td>{s.state ?? "—"}</td>
                  <td>
                    <span className="badge badge-blue">{s.subscription_plan ?? "basic"}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(s.subscription_status)}`}>
                      {s.subscription_status ?? "—"}
                    </span>
                  </td>
                  <td>{s.student_count ?? "—"}</td>
                  <td>{new Date(s.created_at).toLocaleDateString("en-NG")}</td>
                  <td>
                    <button
                      onClick={() => setManaging(s)}
                      style={{
                        padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid #6A5ACD",
                        background: "transparent", color: "#6A5ACD", cursor: "pointer",
                        fontWeight: 700, fontSize: "1.2rem",
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="table-pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="pag-buttons">
              <button className="pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`pag-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pag-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {managing && (
        <SubscriptionModal
          school={managing}
          onClose={() => setManaging(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
