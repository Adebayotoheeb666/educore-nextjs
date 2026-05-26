"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface Subject {
  id: string;
  name: string;
  code?: string;
  teacher_count?: number;
  teacher_names?: string;
  created_at?: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/subjects");
      const d = await res.json();
      setSubjects(Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []));
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"? This action cannot be undone.`)) return;

    try {
      setDeleting((prev) => ({ ...prev, [id]: true }));
      const res = await authenticatedFetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete subject");
      }

      toast.success("Subject deleted successfully");
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subject");
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code ?? "").toLowerCase().includes(q)
    );
  }, [subjects, search]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Subjects</h1>
          <p>Manage curriculum subjects and teacher assignments.</p>
        </div>
        <div className="header-actions">
          <Link href="/subjects/add" className="btn-primary">
            <span>+</span> Add Subject
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading subjects…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            {subjects.length === 0 ? "No subjects found." : "No subjects match your search."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Teachers Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{s.name}</span>
                  </td>
                  <td><span className="mono">{s.code ?? "—"}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="badge badge-blue">{s.teacher_count ?? 0}</span>
                      <span style={{ fontSize: "1.3rem", color: "#64748b" }}>{s.teacher_names ? s.teacher_names.split(",").map(n => n.trim()).join(", ") : "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/subjects/${s.id}`} className="link-action">View</Link>
                      <Link href={`/subjects/${s.id}/edit`} className="link-action">Edit</Link>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        disabled={deleting[s.id]}
                        className="link-action link-action-delete"
                        style={{
                          color: deleting[s.id] ? "#cbd5e1" : "#dc2626",
                          cursor: deleting[s.id] ? "not-allowed" : "pointer",
                          textDecoration: "none",
                          border: "none",
                          background: "none",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        {deleting[s.id] ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
