"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  { value: "primary", label: "Nursery & Primary School" },
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
  const [backupLoading, setBackupLoading] = useState(true);
  const [backupAction, setBackupAction] = useState<"link" | "run" | "restore" | "import" | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [backupStatus, setBackupStatus] = useState({
    active: false,
    googleDriveConnected: false,
    googleDriveFolderId: "",
    lastBackupAt: null as string | null,
    lastRestoreAt: null as string | null,
    oauthConfigured: false,
  });
  const logoRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState({
    name: "", email: "", phone: "", address: "", state: "", type: "",
  });
  const [activities, setActivities] = useState<Array<any>>([]);
  const [termSettings, setTermSettings] = useState({
    academicSession: "", currentTerm: "",
  });

  const searchParams = useSearchParams();

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

  useEffect(() => {
    if (searchParams.get("backupLinked")) {
      toast.success("Google Drive is now linked for backups");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadBackupStatus() {
      setBackupLoading(true);
      try {
        const res = await authenticatedFetch("/api/school/backup");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to load backup status");
        }
        setBackupStatus({
          active: Boolean(data.data.active),
          googleDriveConnected: Boolean(data.data.settings.googleDriveConnected),
          googleDriveFolderId: data.data.settings.googleDriveFolderId ?? "",
          lastBackupAt: data.data.settings.lastBackupAt ?? null,
          lastRestoreAt: data.data.settings.lastRestoreAt ?? null,
          oauthConfigured: Boolean(data.data.oauthConfigured),
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load backup status");
      } finally {
        setBackupLoading(false);
      }
    }

    loadBackupStatus();
    // load recent activity if user is admin
    (async () => {
      try {
        const adminRoles = ["principal", "school_owner", "admin_staff", "super_admin", "vp_admin", "vp_academics", "bursar"];
        if (!user || !adminRoles.includes(user.role)) return;
        const res = await authenticatedFetch("/api/activity?limit=25");
        const data = await res.json();
        if (!res.ok) return;
        setActivities(data.data ?? []);
      } catch (e) {
        // ignore
      }
    })();
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

  const reloadBackupStatus = async () => {
    setBackupLoading(true);
    try {
      const res = await authenticatedFetch("/api/school/backup");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load backup status");
      setBackupStatus({
        active: Boolean(data.data.active),
        googleDriveConnected: Boolean(data.data.settings.googleDriveConnected),
        googleDriveFolderId: data.data.settings.googleDriveFolderId ?? "",
        lastBackupAt: data.data.settings.lastBackupAt ?? null,
        lastRestoreAt: data.data.settings.lastRestoreAt ?? null,
        oauthConfigured: Boolean(data.data.oauthConfigured),
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load backup status");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleLinkDrive = async () => {
    setBackupAction("link");
    try {
      const res = await authenticatedFetch("/api/school/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start Google Drive connection");
      const authorizationUrl = data.data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error("Google Drive authorization URL was not returned");
      }
      window.location.href = authorizationUrl;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not start Google Drive connection");
    } finally {
      setBackupAction(null);
    }
  };

  const handleRunBackup = async () => {
    setBackupAction("run");
    try {
      const res = await authenticatedFetch("/api/school/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Backup failed");
      toast.success(data.message || "Backup completed successfully");
      await reloadBackupStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Backup failed");
    } finally {
      setBackupAction(null);
    }
  };

  const handleImportFromDrive = async () => {
    setBackupAction("import");
    try {
      const res = await authenticatedFetch("/api/school/backup/import-drive", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Restore from Drive failed");
      toast.success(data.message || "Imported backup from Drive successfully");
      await reloadBackupStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restore from Drive failed");
    } finally {
      setBackupAction(null);
    }
  };

  const handleDisconnectDrive = async () => {
    // open confirmation modal
    setShowDisconnectConfirm(true);
  };

  const handleConfirmDisconnect = async () => {
    setShowDisconnectConfirm(false);
    setBackupAction("link");
    try {
      const res = await authenticatedFetch("/api/school/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to disconnect Google Drive");
      toast.success(data.message || "Google Drive disconnected");
      await reloadBackupStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setBackupAction(null);
    }
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectConfirm(false);
  };

  const triggerFileRestore = () => {
    restoreFileRef.current?.click();
  };

  const handleRestoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupAction("restore");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authenticatedFetch("/api/school/backup/restore", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Restore failed");
      toast.success(data.message || "Backup restored successfully");
      await reloadBackupStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBackupAction(null);
      if (restoreFileRef.current) {
        restoreFileRef.current.value = "";
      }
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

      <div className="form-card" style={{ marginBottom: "2.5rem" }}>
        <h2 className="form-section-title">Backup & Recovery</h2>
        <p style={{ color: "#64748b", fontSize: "1.3rem", marginBottom: "1.5rem" }}>
          Free backup and restore tools keep your school data safe. Connect Google Drive to enable automatic uploads and restore from Drive or a JSON file.
        </p>

        {backupLoading ? (
          <div className="table-empty">Loading backup settings…</div>
        ) : !backupStatus.active ? (
          <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: "1.4rem" }}>
            <p style={{ margin: 0, fontSize: "1.15rem", color: "#3730a3" }}>
              Backup & Recovery is a free optional service. Activate it in the Services page to configure Google Drive sync, manual restore, and scheduled backups.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.4rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>Google Drive</p>
                <p style={{ margin: "0.5rem 0 0", fontWeight: 700, color: backupStatus.googleDriveConnected ? "#047857" : "#7c3aed" }}>
                  {backupStatus.googleDriveConnected ? "Connected" : "Not connected"}
                </p>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>Last backup</p>
                <p style={{ margin: "0.5rem 0 0", fontWeight: 700, color: "#1e293b" }}>
                  {backupStatus.lastBackupAt ? new Date(backupStatus.lastBackupAt).toLocaleString() : "Not yet backed up"}
                </p>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: "1.2rem" }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>Last restore</p>
                <p style={{ margin: "0.5rem 0 0", fontWeight: 700, color: "#1e293b" }}>
                  {backupStatus.lastRestoreAt ? new Date(backupStatus.lastRestoreAt).toLocaleString() : "No restore activity"}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              {!backupStatus.googleDriveConnected ? (
                <button
                  type="button"
                  onClick={handleLinkDrive}
                  disabled={!backupStatus.oauthConfigured || backupAction === "link"}
                  className="btn-primary"
                  style={{ width: "100%" }}
                >
                  {backupAction === "link" ? "Connecting…" : "Connect Google Drive"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRunBackup}
                    disabled={backupAction === "run"}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
                    {backupAction === "run" ? "Backing up…" : "Run backup now"}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportFromDrive}
                    disabled={backupAction === "import"}
                    className="btn-secondary"
                    style={{ width: "100%" }}
                  >
                    {backupAction === "import" ? "Importing…" : "Import latest backup from Drive"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectDrive}
                    disabled={backupAction === "link"}
                    className="btn-secondary"
                    style={{ width: "100%", borderColor: "#fecaca", color: "#b91c1c" }}
                  >
                    Disconnect Google Drive
                  </button>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={triggerFileRestore}
                      disabled={backupAction === "restore"}
                      className="btn-secondary"
                      style={{ flex: 1, minWidth: 180 }}
                    >
                      {backupAction === "restore" ? "Restoring…" : "Restore from JSON file"}
                    </button>
                    <input
                      ref={restoreFileRef}
                      type="file"
                      accept="application/json"
                      hidden
                      onChange={handleRestoreUpload}
                    />
                  </div>
                  <p style={{ margin: "0.8rem 0 0", color: "#475569", fontSize: "0.95rem" }}>
                    Use the scheduled backup endpoint <code>/api/school/backup/scheduled</code> in your cron or task scheduler for Sunday night recovery runs. The request must include <code>X-BACKUP-SCHEDULER-KEY</code>.
                  </p>
                </>
              )}

            {activities.length > 0 && (
              <div style={{ marginTop: "1rem", borderTop: "1px dashed #e6eef8", paddingTop: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Recent Activity</h3>
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {activities.map((a) => (
                    <div key={a.id} style={{ background: "#fff", border: "1px solid #e6eef8", padding: "0.8rem", borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{a.action}</div>
                          <div style={{ color: "#64748b", fontSize: "0.95rem" }}>{a.details}</div>
                        </div>
                        <div style={{ textAlign: "right", color: "#94a3b8", fontSize: "0.85rem" }}>
                          <div>{a.user_name ?? 'System'}</div>
                          <div>{new Date(a.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {!backupStatus.googleDriveConnected && !backupStatus.oauthConfigured && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "1rem" }}>
                <p style={{ margin: 0, color: "#92400e" }}>
                  Google Drive backup requires OAuth credentials to be configured in the server environment. Contact your administrator to set up <code>GOOGLE_DRIVE_CLIENT_ID</code> and <code>GOOGLE_DRIVE_CLIENT_SECRET</code>.
                </p>
              </div>
            )}

            {backupStatus.googleDriveFolderId && (
              <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem" }}>
                Backup folder ID: <strong>{backupStatus.googleDriveFolderId}</strong>
              </p>
            )}
          </div>
        )}
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
      {showDisconnectConfirm && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "1.4rem", borderRadius: 8, maxWidth: 520, width: "92%" }}>
            <h3 style={{ marginTop: 0 }}>Disconnect Google Drive</h3>
            <p style={{ color: "#374151" }}>Disconnecting will remove stored Drive tokens. You will need to reconnect to use Drive backups.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
              <button onClick={handleCancelDisconnect} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmDisconnect} className="btn-primary" disabled={backupAction === "link"}>
                {backupAction === "link" ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
