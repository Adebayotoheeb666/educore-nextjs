"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import "../shared.css";

interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  subject_count?: number;
  created_at?: string;
}

const PAGE_SIZE = 15;

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/teachers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTeachers(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load teachers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) ||
        (t.phone ?? "").includes(q)
    );
  }, [teachers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      toast.success("Teacher removed");
    } catch {
      toast.error("Failed to remove teacher");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const roleLabel = (role?: string) =>
    role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Teacher";

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{teachers.length ? `${teachers.length.toLocaleString()} Teachers` : "Teachers"}</h1>
          <p>Manage staff profiles, subject assignments, and workload.</p>
        </div>
        <div className="header-actions">
          <Link href="/teachers/add" className="btn-primary">
            <span>+</span> Add Teacher
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading teachers…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">
            {teachers.length === 0 ? "No teachers found." : "No teachers match your search."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Subjects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="info-cell">
                      <div className="avatar-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`}
                          alt=""
                        />
                      </div>
                      <div className="name-stack">
                        <h4>{t.name}</h4>
                        <p>
                          {t.created_at
                            ? `Joined ${new Date(t.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{t.email ?? "—"}</td>
                  <td>{t.phone ?? "—"}</td>
                  <td>
                    <span className="badge badge-blue">{roleLabel(t.role)}</span>
                  </td>
                  <td>{t.subject_count ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/teachers/${t.id}`} className="link-action">View</Link>
                      {confirmDelete === t.id ? (
                        <>
                          <button
                            className="btn-confirm-sm"
                            disabled={deleting}
                            onClick={() => handleDelete(t.id)}
                          >
                            {deleting ? "…" : "Confirm"}
                          </button>
                          <button
                            className="btn-cancel-sm"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-danger-sm"
                          onClick={() => setConfirmDelete(t.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="table-pagination">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} teachers
            </span>
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
    </div>
  );
}
