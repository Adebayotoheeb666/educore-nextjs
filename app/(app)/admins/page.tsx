"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  is_active?: number;
  created_at?: string;
}

const PAGE_SIZE = 15;

export default function AdminListPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    authenticatedFetch("/api/admins")
      .then((res) => res.json())
      .then((data) => setAdmins(Array.isArray(data.data) ? data.data : []))
      .catch(() => toast.error("Failed to load admins"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((admin) =>
      admin.name.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q) ||
      (admin.role ?? "").toLowerCase().includes(q)
    );
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{admins.length ? `${admins.length.toLocaleString()} Admins` : "Admins"}</h1>
          <p>View and manage leadership and admin staff for your school.</p>
        </div>
        <div className="header-actions">
          <Link href="/admins/add" className="btn-primary">
            <span>+</span> Add Admin
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading admins…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">No admins found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="info-cell">
                      <div className="avatar-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={admin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`}
                          alt={admin.name}
                        />
                      </div>
                      <div className="name-stack">
                        <h4>{admin.name}</h4>
                        <p>{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td>{admin.phone || "—"}</td>
                  <td><span className="badge badge-blue">{admin.role.replace(/_/g, " ")}</span></td>
                  <td>
                    <span className={`badge ${admin.is_active ? "badge-green" : "badge-red"}`}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString("en-GB") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="table-pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
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
