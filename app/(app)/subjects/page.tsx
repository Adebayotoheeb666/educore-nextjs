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

  useEffect(() => {
    authenticatedFetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => setSubjects(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, []);

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
