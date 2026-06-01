"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import "../../shared.css";

interface BehaviorLog {
  id: string;
  incident_type: string;
  description: string;
  severity: string;
  date: string;
  teacher_name?: string;
  points: number;
}

export default function StudentBehaviorPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/behavior?student_id=${user.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLogs(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load behavior records"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalPoints = logs.reduce((sum, l) => sum + (Number(l.points) || 0), 0);
  const positiveCount = logs.filter((l) => (Number(l.points) || 0) > 0).length;
  const negativeCount = logs.filter((l) => (Number(l.points) || 0) < 0).length;

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "badge-gray";
    if (severity.toLowerCase() === "critical") return "badge-red";
    if (severity.toLowerCase() === "high") return "badge-orange";
    if (severity.toLowerCase() === "medium") return "badge-yellow";
    return "badge-green";
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>My Behavior Record</h1>
          <p>View your behavior incidents and conduct points.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
        {[
          { label: "Total Points", value: totalPoints, color: totalPoints >= 0 ? "#22c55e" : "#ef4444", icon: "⭐" },
          { label: "Positive Records", value: positiveCount, color: "#22c55e", icon: "✅" },
          { label: "Incidents", value: negativeCount, color: negativeCount === 0 ? "#22c55e" : "#ef4444", icon: "⚠️" },
          { label: "Total Records", value: logs.length, color: "#3b82f6", icon: "📋" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "white", borderRadius: 12, border: "1px solid #f1f5f9", padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
            <div style={{ fontSize: "1rem", color: "#64748b", fontWeight: 600, marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      {loading ? (
        <div className="table-empty">Loading behavior records…</div>
      ) : logs.length === 0 ? (
        <div className="table-empty" style={{ background: "#f0fdf4", color: "#166534" }}>
          ✅ No behavior incidents recorded. Great job!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "1.5rem",
                background: "white",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                borderLeft: `4px solid ${
                  (log.points || 0) > 0 ? "#22c55e" : "#ef4444"
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.8rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "#1e293b" }}>
                  {log.incident_type}
                </div>
                <span className={`badge ${getSeverityColor(log.severity)}`}>
                  {log.severity || "Normal"}
                </span>
              </div>

              {log.description && (
                <div style={{ fontSize: "1.3rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.5 }}>
                  {log.description}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "#94a3b8" }}>
                <span>📅 {new Date(log.date).toLocaleDateString("en-NG")}</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: (log.points || 0) > 0 ? "#22c55e" : "#ef4444",
                  }}
                >
                  {(log.points || 0) > 0 ? "+" : ""}{log.points} pts
                </span>
              </div>

              {log.teacher_name && (
                <div style={{ fontSize: "1.2rem", color: "#64748b", marginTop: "0.8rem" }}>
                  👨‍🏫 {log.teacher_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
