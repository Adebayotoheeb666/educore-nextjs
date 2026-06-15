"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { FiPlus, FiMapPin, FiMail, FiPhone, FiCalendar, FiArrowRight, FiCheckCircle, FiBriefcase } from "react-icons/fi";
import "../../shared.css";

const styles = `
  .branches-page { }
  .branch-form-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2.5rem;
    border-radius: 20px;
    color: white;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  }
  .branch-form-section h2 {
    color: white;
    margin: 0 0 0.5rem;
    font-size: 1.6rem;
    font-weight: 800;
  }
  .branch-form-section p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-size: 1.05rem;
  }
  .form-card {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    margin-top: 2rem;
  }
  .branch-input {
    width: 100%;
    padding: 0.85rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  .branch-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .form-group label {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.95rem;
  }
  .create-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem 2.5rem;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    transition: all 0.3s ease;
    margin-top: 0.5rem;
  }
  .create-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }
  .create-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .branches-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  .branches-header-left h2 {
    margin: 0 0 0.5rem;
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
  }
  .branches-header-left p {
    margin: 0;
    color: #64748b;
    font-size: 1.05rem;
  }
  .branch-count {
    background: #f0f9ff;
    border: 1.5px solid #bae6fd;
    color: #0369a1;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
  }
  .branch-card {
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 2rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .branch-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  .branch-card.active {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }
  .branch-card.active::before {
    transform: scaleX(1);
  }
  .branch-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }
  .branch-card-title {
    flex: 1;
  }
  .branch-card-title h3 {
    margin: 0 0 0.4rem;
    font-size: 1.3rem;
    font-weight: 800;
    color: #0f172a;
  }
  .branch-card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.95rem;
  }
  .branch-card-meta svg {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }
  .branch-status {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    background: #ecfdf5;
    color: #065f46;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .branch-status svg {
    width: 16px;
    height: 16px;
  }
  .branch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.2rem;
    margin-bottom: 2rem;
  }
  .branch-detail {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }
  .branch-detail-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #667eea;
    margin-top: 0.15rem;
  }
  .branch-detail-content {
    flex: 1;
  }
  .branch-detail-label {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.2rem;
  }
  .branch-detail-value {
    font-size: 0.95rem;
    color: #334155;
    font-weight: 500;
  }
  .branch-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }
  .switch-btn {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    transition: all 0.3s ease;
  }
  .switch-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  .switch-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .switch-btn.current {
    background: #ecfdf5;
    color: #065f46;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #fce7f3 100%);
    border: 2px dashed #bae6fd;
    border-radius: 16px;
  }
  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  .empty-state h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: #0f172a;
  }
  .empty-state p {
    color: #64748b;
    margin: 0;
    font-size: 1rem;
  }
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    color: #64748b;
    font-size: 1.05rem;
  }
  .loading-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .loading-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    .branches-list-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    .branch-grid {
      grid-template-columns: 1fr;
    }
  }
`;


interface SchoolBranch {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  type?: string | null;
  address?: string | null;
  subscription_status?: string;
  subscription_plan?: string;
  academic_session?: string;
  current_term?: string;
  created_at: string;
  updated_at: string;
}

export default function SchoolBranchesPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const activeSchoolId = user?.schoolId;
  const [branches, setBranches] = useState<SchoolBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", state: "", type: "", address: "" });

  const ownSchoolOwner = useMemo(() => user?.role === "school_owner", [user]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/school/branches");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load branches");
      setBranches(data.data ?? []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unable to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return toast.error("Branch name is required");
    }
    setSaving(true);
    try {
      const res = await authenticatedFetch("/api/school/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create branch");
      setBranches((prev) => [data.data, ...prev]);
      setForm({ name: "", email: "", phone: "", state: "", type: "", address: "" });
      toast.success("Branch created successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitch = async (branchId: string) => {
    if (switching) return;
    setSwitching(branchId);
    try {
      const res = await authenticatedFetch("/api/school/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to switch branch");
      dispatch(setUser({ ...user, schoolId: branchId } as any));
      toast.success("Switched active branch");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unable to switch branch");
    } finally {
      setSwitching(null);
    }
  };

  if (!ownSchoolOwner) {
    return (
      <div className="page-content">
        <style>{styles}</style>
        <div className="page-header">
          <h1 className="page-title">Branch Management</h1>
          <p className="page-subtitle">Manage school branches across multiple locations</p>
        </div>
        <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔐</div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#991b1b" }}>Access Restricted</h3>
          <p style={{ margin: "0.5rem 0 0", color: "#7f1d1d", fontSize: "1rem" }}>
            Only school owners can manage branches. Contact your school owner to create or manage branches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content branches-page">
      <style>{styles}</style>
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>🏢 School Branches</h1>
          <p className="page-subtitle" style={{ fontSize: "1.1rem" }}>Manage separate branch schools for your organisation. Each branch operates independently with its own users and data.</p>
        </div>
      </div>

      {/* Create Branch Section */}
      <div className="branch-form-section">
        <h2>✨ Create a New Branch</h2>
        <p>Expand your school network by adding a new branch location</p>
        <div className="form-card">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Branch Name *</label>
                <input
                  id="name"
                  type="text"
                  className="branch-input"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Lagos Campus, Abuja Branch"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">School Type</label>
                <input
                  id="type"
                  type="text"
                  className="branch-input"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Primary, Secondary"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="branch-input"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="branch@school.edu"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="branch-input"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State/Region</label>
                <input
                  id="state"
                  type="text"
                  className="branch-input"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="e.g., Lagos, Abuja, Kano"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Full Address</label>
                <input
                  id="address"
                  type="text"
                  className="branch-input"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street, Building A"
                />
              </div>
            </div>

            <button type="submit" className="create-btn" disabled={saving}>
              <FiPlus size={18} />
              {saving ? "Creating…" : "Create Branch"}
            </button>
          </form>
        </div>
      </div>

      {/* Branches List Section */}
      <div style={{ marginTop: "3rem" }}>
        <div className="branches-list-header">
          <div className="branches-header-left">
            <h2>Your Branches</h2>
            <p>Click "Switch" to manage a different branch location</p>
          </div>
          <span className="branch-count">{branches.length} Location{branches.length === 1 ? "" : "s"}</span>
        </div>

        {loading ? (
          <div className="loading-spinner">
            ⏳ Loading branches
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        ) : branches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Branches Yet</h3>
            <p>Create your first branch using the form above to get started</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {branches.map((branch) => {
              const isActive = branch.id === activeSchoolId;
              return (
                <div key={branch.id} className={`branch-card ${isActive ? "active" : ""}`}>
                  <div className="branch-card-top">
                    <div className="branch-card-title">
                      <h3>{branch.name}</h3>
                      <div className="branch-card-meta">
                        <FiBriefcase />
                        <span>{branch.type || "School"}</span>
                        <span>•</span>
                        <FiMapPin />
                        <span>{branch.state || "Location unknown"}</span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="branch-status">
                        <FiCheckCircle />
                        Active
                      </div>
                    )}
                  </div>

                  <div className="branch-grid">
                    {branch.email && (
                      <div className="branch-detail">
                        <FiMail className="branch-detail-icon" />
                        <div className="branch-detail-content">
                          <div className="branch-detail-label">Email</div>
                          <div className="branch-detail-value">{branch.email}</div>
                        </div>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="branch-detail">
                        <FiPhone className="branch-detail-icon" />
                        <div className="branch-detail-content">
                          <div className="branch-detail-label">Phone</div>
                          <div className="branch-detail-value">{branch.phone}</div>
                        </div>
                      </div>
                    )}
                    {branch.address && (
                      <div className="branch-detail">
                        <FiMapPin className="branch-detail-icon" />
                        <div className="branch-detail-content">
                          <div className="branch-detail-label">Address</div>
                          <div className="branch-detail-value">{branch.address}</div>
                        </div>
                      </div>
                    )}
                    {branch.current_term && (
                      <div className="branch-detail">
                        <FiCalendar className="branch-detail-icon" />
                        <div className="branch-detail-content">
                          <div className="branch-detail-label">Term</div>
                          <div className="branch-detail-value">{branch.current_term}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="branch-actions">
                    <button
                      type="button"
                      className={`switch-btn ${isActive ? "current" : ""}`}
                      disabled={isActive || Boolean(switching)}
                      onClick={() => handleSwitch(branch.id)}
                    >
                      {isActive ? (
                        <>
                          <FiCheckCircle size={16} />
                          Current Branch
                        </>
                      ) : switching === branch.id ? (
                        <>
                          <span className="loading-dot"></span>
                          Switching…
                        </>
                      ) : (
                        <>
                          <FiArrowRight size={16} />
                          Switch Branch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
