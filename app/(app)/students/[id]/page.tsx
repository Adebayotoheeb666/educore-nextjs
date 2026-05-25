"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  admission_no?: string;
  gender?: string;
  dob?: string;
  parent_phone?: string;
  address?: string;
  state_of_origin?: string;
  created_at?: string;
  avatar?: string;
  parent_id?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone_linked?: string;
}

interface AcademicResult {
  id: string;
  term?: string;
  session?: string;
  overall_percentage?: number;
  grade?: string;
  position?: number;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<AcademicResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      authenticatedFetch(`/api/students/${id}`).then((r) => r.json()),
      authenticatedFetch(`/api/students/${id}/history`).then((r) => r.json()),
    ])
      .then(([sd, hd]) => {
        setStudent(sd.data);
        setHistory(Array.isArray(hd.data) ? hd.data : []);
      })
      .catch(() => toast.error("Failed to load student"))
      .finally(() => setLoading(false));
  }, [id, refreshKey]);

  const handleDelete = async () => {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    try {
      const res = await authenticatedFetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Student deleted");
      router.push("/students");
    } catch {
      toast.error("Failed to delete student");
    }
  };

  if (loading) return <div className="table-empty">Loading student…</div>;
  if (!student) return <div className="table-empty">Student not found.</div>;

  const displayName = student.name;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/students" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Students
        </Link>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", padding: "3rem", marginBottom: "2.5rem", display: "flex", gap: "3rem", alignItems: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #ede9fa" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=80`}
            alt=""
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>{displayName}</h1>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-green">Active</span>
            <span className="mono" style={{ fontSize: "1.2rem", color: "#64748b" }}>{student.admission_no}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href={`/students/${id}/edit`} className="btn-outline">✏️ Edit</Link>
          <button className="btn-danger-sm" style={{ padding: "1.1rem 2rem", fontSize: "1.3rem" }} onClick={handleDelete}>
            🗑 Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {(["profile", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.9rem 2rem",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              fontSize: "1.4rem",
              cursor: "pointer",
              background: activeTab === tab ? "#6A5ACD" : "#f1f5f9",
              color: activeTab === tab ? "white" : "#475569",
              textTransform: "capitalize",
            }}
          >
            {tab === "profile" ? "👤 Profile" : "📊 Academic History"}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="form-card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
            {[
              { label: "Full Name",       value: student.name },
              { label: "Email",           value: student.email ?? "—" },
              { label: "Gender",          value: student.gender ?? "—" },
              { label: "Date of Birth",   value: student.dob ? new Date(student.dob).toLocaleDateString("en-NG") : "—" },
              { label: "Admission No.",   value: student.admission_no ?? "—" },
              { label: "Linked Parent",   value: student.parent_name ? `${student.parent_name} (${student.parent_email})` : "—" },
              { label: "Parent Phone",    value: student.parent_phone ?? "—" },
              { label: "Address",         value: student.address ?? "—" },
              { label: "State of Origin", value: student.state_of_origin ?? "—" },
              { label: "Enrolled",        value: student.created_at ? new Date(student.created_at).toLocaleDateString("en-NG") : "—" },
            ].map((f) => (
              <div key={f.label} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  {f.label}
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "#0f172a" }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="premium-table-card">
          {history.length === 0 ? (
            <div className="table-empty">No academic history available.</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Session</th>
                  <th>Overall %</th>
                  <th>Grade</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td>{r.term ?? "—"}</td>
                    <td>{r.session ?? "—"}</td>
                    <td style={{ fontWeight: 800, color: (r.overall_percentage ?? 0) < 40 ? "#ef4444" : "#22c55e" }}>
                      {r.overall_percentage != null ? `${r.overall_percentage}%` : "—"}
                    </td>
                    <td><span className={`badge ${r.grade === "A" ? "badge-green" : r.grade === "F" ? "badge-red" : "badge-yellow"}`}>{r.grade ?? "—"}</span></td>
                    <td>{r.position ? `#${r.position}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
