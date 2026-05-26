"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface ClassItem {
  id: string;
  name: string;
  section?: string;
  level?: string;
  teacher_id?: string;
  teacher_name?: string;
  student_count?: number;
  subject_count?: number;
  created_at?: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("/api/classes");
      const d = await res.json();
      setClasses(Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []));
    } catch (err) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? This action cannot be undone.`)) return;

    try {
      setDeleting((prev) => ({ ...prev, [id]: true }));
      const res = await authenticatedFetch(`/api/classes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete class");
      }

      toast.success("Class deleted successfully");
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.section ?? "").toLowerCase().includes(q) ||
        (c.teacher_name ?? "").toLowerCase().includes(q)
    );
  }, [classes, search]);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Classes</h1>
          <p>Manage class arms, form teachers, and student enrolment.</p>
        </div>
        <div className="header-actions">
          <Link href="/classes/add" className="btn-primary">
            <span>+</span> Add Class
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by class name, section, or teacher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading classes…</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            {classes.length === 0 ? "No classes found." : "No classes match your search."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Section / Arm</th>
                <th>Form Teacher</th>
                <th>Students</th>
                <th>Subjects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="name-stack">
                      <h4>{c.name}</h4>
                      {c.level && <p>{c.level}</p>}
                    </div>
                  </td>
                  <td>{c.section ?? "—"}</td>
                  <td>{c.teacher_name ?? "—"}</td>
                  <td>
                    <span className="badge badge-green">{c.student_count ?? 0}</span>
                  </td>
                  <td>{c.subject_count ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/classes/${c.id}`} className="link-action">View</Link>
                      <Link href={`/classes/${c.id}/edit`} className="link-action">Edit</Link>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting[c.id]}
                        className="link-action link-action-delete"
                        style={{
                          color: deleting[c.id] ? "#cbd5e1" : "#dc2626",
                          cursor: deleting[c.id] ? "not-allowed" : "pointer",
                          textDecoration: "none",
                          border: "none",
                          background: "none",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        {deleting[c.id] ? "Deleting..." : "Delete"}
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
