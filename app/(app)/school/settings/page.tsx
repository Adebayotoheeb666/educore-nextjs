"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface SchoolData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  type: string | null;
  logo: string | null;
  sub_domain: string | null;
  academic_session: string;
  current_term: string;
  subscription_status: string;
  subscription_plan: string;
}

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const SCHOOL_TYPES = [
  { value: "primary", label: "Primary School" },
  { value: "secondary", label: "Secondary School" },
  { value: "primary_secondary", label: "Primary & Secondary" },
  { value: "tertiary", label: "Tertiary Institution" },
  { value: "vocational", label: "Vocational / Technical" },
];

const TERMS = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "third", label: "Third Term" },
];

export default function SchoolSettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState({
    name: "", email: "", phone: "", address: "", state: "", type: "",
  });
  const [termSettings, setTermSettings] = useState({
    academicSession: "", currentTerm: "",
  });

  useEffect(() => {
    authenticatedFetch("/api/school")
      .then((r) => r.json())
      .then((d) => {
        const s: SchoolData = d.data;
        setSchool(s);
        setInfo({
          name: s.name ?? "",
          email: s.email ?? "",
          phone: s.phone ?? "",
          address: s.address ?? "",
          state: s.state ?? "",
          type: s.type ?? "",
        });
        setTermSettings({
          academicSession: s.academic_session ?? "",
          currentTerm: s.current_term ?? "",
        });
      })
      .catch(() => toast.error("Failed to load school data"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB");
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "educore/logos");
      const res = await authenticatedFetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const url = data.data.url as string;
      // Persist logo URL to school record
      await authenticatedFetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: url }),
      });
      setSchool((prev) => prev ? { ...prev, logo: url } : prev);
      toast.success("Logo updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.name.trim()) return toast.error("School name is required");
    setSavingInfo(true);
    try {
      const res = await authenticatedFetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSchool((prev) => prev ? { ...prev, ...info } : prev);
      toast.success("School information saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTerm(true);
    try {
      const res = await authenticatedFetch("/api/school/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSchool((prev) =>
        prev
          ? { ...prev, academic_session: termSettings.academicSession, current_term: termSettings.currentTerm }
          : prev
      );
      toast.success("Academic settings saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingTerm(false);
    }
  };

  const logoSrc = school?.logo
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(school?.name ?? "School")}&background=6A5ACD&color=fff&size=80&bold=true`;

  if (loading) {
    return (
      <div className="dashboard-main">
        <div className="table-empty">Loading school settings…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "3rem", maxWidth: 900, margin: "0 auto" }}>
      <div className="page-header-row" style={{ marginBottom: "3rem" }}>
        <div className="page-header-text">
          <h1>School Settings</h1>
          <p>Manage your school profile, contact details, and academic configuration.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <span style={{
            padding: "0.4rem 1.2rem",
            borderRadius: 20,
            fontSize: "1.2rem",
            fontWeight: 700,
            background: school?.subscription_status === "active" ? "#dcfce7" : "#fef9c3",
            color: school?.subscription_status === "active" ? "#166534" : "#854d0e",
          }}>
            {(school?.subscription_plan ?? "basic").toUpperCase()} · {(school?.subscription_status ?? "trial").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Logo section */}
      <div className="form-card" style={{ marginBottom: "2.5rem" }}>
        <h2 className="form-section-title">School Logo</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <div style={{ position: "relative" }}>
            <img
              src={logoSrc}
              alt="School logo"
              style={{ width: 90, height: 90, borderRadius: 16, objectFit: "cover", border: "2px solid #e2e8f0" }}
            />
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              style={{
                position: "absolute", bottom: -6, right: -6,
                width: 28, height: 28, borderRadius: "50%",
                background: "#6A5ACD", border: "2px solid #fff",
                color: "#fff", fontSize: "1.4rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Change logo"
            >
              ✏️
            </button>
          </div>
          <div>
            <p style={{ fontWeight: 700, marginBottom: "0.4rem", fontSize: "1.4rem" }}>{school?.name}</p>
            <p style={{ color: "#64748b", fontSize: "1.3rem", marginBottom: "1rem" }}>
              PNG or JPG, max 2 MB. Recommended: 200×200 px square.
            </p>
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="btn-secondary"
              style={{ padding: "0.8rem 1.6rem", fontSize: "1.3rem" }}
            >
              {uploadingLogo ? "Uploading…" : "Change Logo"}
            </button>
          </div>
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
        </div>
      </div>

      {/* School information */}
      <div className="form-card" style={{ marginBottom: "2.5rem" }}>
        <h2 className="form-section-title">School Information</h2>
        <form onSubmit={handleSaveInfo}>
          <div className="form-grid-2" style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>School Name *</label>
              <input
                value={info.name}
                onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                placeholder="Lagos International Academy"
                required
              />
            </div>
            <div className="form-group">
              <label>School Email</label>
              <input
                type="email"
                value={info.email}
                onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin@school.ng"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={info.phone}
                onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+234 801 234 5678"
              />
            </div>
            <div className="form-group">
              <label>School Type</label>
              <select
                value={info.type}
                onChange={(e) => setInfo((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="">Select type…</option>
                {SCHOOL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>State</label>
              <select
                value={info.state}
                onChange={(e) => setInfo((p) => ({ ...p, state: e.target.value }))}
              >
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                value={info.address}
                onChange={(e) => setInfo((p) => ({ ...p, address: e.target.value }))}
                placeholder="12 School Road, Yaba"
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={savingInfo}>
              {savingInfo ? "Saving…" : "Save Information"}
            </button>
          </div>
        </form>
      </div>

      {/* Academic settings */}
      <div className="form-card" style={{ marginBottom: "2.5rem" }}>
        <h2 className="form-section-title">Academic Settings</h2>
        <p style={{ color: "#64748b", fontSize: "1.3rem", marginBottom: "2.5rem", marginTop: "-1.5rem" }}>
          These settings determine which session and term is active across the entire platform.
        </p>
        <form onSubmit={handleSaveTerm}>
          <div className="form-grid-2" style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>Academic Session</label>
              <input
                value={termSettings.academicSession}
                onChange={(e) => setTermSettings((p) => ({ ...p, academicSession: e.target.value }))}
                placeholder="2024/2025"
                pattern="\d{4}/\d{4}"
                title="Format: 2024/2025"
              />
            </div>
            <div className="form-group">
              <label>Current Term</label>
              <select
                value={termSettings.currentTerm}
                onChange={(e) => setTermSettings((p) => ({ ...p, currentTerm: e.target.value }))}
              >
                {TERMS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "1.2rem 1.6rem", marginBottom: "2rem" }}>
            <p style={{ margin: 0, fontSize: "1.3rem", color: "#92400e" }}>
              ⚠️ Changing the academic session or term affects attendance records, result computation, and fee schedules across all classes.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={savingTerm}>
              {savingTerm ? "Saving…" : "Save Academic Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Subdomain info (read-only) */}
      <div className="form-card">
        <h2 className="form-section-title">Platform Details</h2>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Sub-domain</label>
            <input value={school?.sub_domain ?? "—"} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
          </div>
          <div className="form-group">
            <label>Subscription Plan</label>
            <input value={`${school?.subscription_plan ?? "basic"} (${school?.subscription_status ?? "trial"})`} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
          </div>
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "1.3rem", color: "#94a3b8" }}>
          Sub-domain cannot be changed after registration. To upgrade your plan, contact support.
        </p>
      </div>
    </div>
  );
}
