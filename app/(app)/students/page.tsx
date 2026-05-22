"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface Student {
  id: string;
  name: string;
  admission_no?: string;
  gender?: string;
  phone?: string;
  parent_phone?: string;
  is_active?: number;
  created_at?: string;
}

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/students")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        console.log("Students API response:", d);
        setStudents(Array.isArray(d.data) ? d.data : []);
      })
      .catch((err) => {
        console.error("Failed to load students:", err);
        toast.error("Failed to load students");
      })
      .finally(() => setLoading(false));
  }, []);

  const classes: string[] = [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.admission_no ?? "").toLowerCase().includes(q) ||
        (s.parent_phone ?? s.phone ?? "").includes(q);
      const matchGender = !genderFilter || (s.gender ?? "") === genderFilter;
      return matchSearch && matchGender;
    });
  }, [students, search, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student deleted");
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{students.length ? `${students.length.toLocaleString()} Total Students` : "Students"}</h1>
          <p>Manage the academic records and profiles of all enrolled students.</p>
        </div>
        <div className="header-actions">
          <Link href="/students/bulk-import" className="btn-outline">
            <span>📤</span> Bulk Import
          </Link>
          <Link href="/students/add" className="btn-primary">
            <span>+</span> Add Student
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, or parent phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="filter-select"
          value={genderFilter}
          onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {(search || genderFilter) && (
          <button
            className="btn-outline"
            onClick={() => { setSearch(""); setGenderFilter(""); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading students…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">
            {students.length === 0 ? "No students found." : "No students match your filters."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission No.</th>
                <th>Gender</th>
                <th>Parent Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="info-cell">
                      <div className="avatar-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`}
                          alt=""
                        />
                      </div>
                      <div className="name-stack">
                        <h4>{s.name}</h4>
                        <p>
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString("en-GB", {
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono">{s.admission_no ?? "—"}</span></td>
                  <td>{s.gender ?? "—"}</td>
                  <td>{s.parent_phone ?? s.phone ?? "—"}</td>
                  <td>
                    <span className={`badge ${(s.is_active ?? 1) ? "badge-green" : "badge-gray"}`}>
                      {(s.is_active ?? 1) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/students/${s.id}`} className="link-action">View</Link>
                      {confirmDelete === s.id ? (
                        <>
                          <button
                            className="btn-confirm-sm"
                            disabled={deleting}
                            onClick={() => handleDelete(s.id)}
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
                          onClick={() => setConfirmDelete(s.id)}
                        >
                          Delete
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
              {filtered.length} students
            </span>
            <div className="pag-buttons">
              <button
                className="pag-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pag-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pag-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
