"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface User {
  id: string; name: string; email: string; role: string;
  is_active?: number; school_name?: string; created_at: string;
}

const PAGE_SIZE = 20;
const ROLES = ["student", "class_teacher", "subject_teacher", "parent", "admin", "school_owner", "super_admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    authenticatedFetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d.data) ? d.data : d.data?.users ?? []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = !role || u.role === role;
      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggle = async (u: User) => {
    try {
      const res = await authenticatedFetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: u.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: u.is_active ? 0 : 1 } : x));
      toast.success(`User ${u.is_active ? "deactivated" : "activated"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.name}"? This action cannot be undone.`)) return;
    try {
      const res = await authenticatedFetch(`/api/admin/users/${u.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("User deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete student");
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>All Users</h1>
          <p>Platform-wide user management.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="premium-table-card">
        {loading ? (
          <div className="table-empty">Loading users…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">No users found.</div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>School</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td style={{ color: "#64748b" }}>{u.email}</td>
                  <td><span className="badge badge-blue">{u.role.replace(/_/g, " ")}</span></td>
                  <td>{u.school_name ?? "—"}</td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "0.8rem" }}>
                    <button
                      className="btn-outline"
                      onClick={() => handleToggle(u)}
                      style={{ padding: "0.5rem 1.2rem", fontSize: "1.2rem", borderRadius: 8 }}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => handleDelete(u)}
                      style={{ padding: "0.5rem 1.2rem", fontSize: "1.2rem", borderRadius: 8, color: "#dc2626", borderColor: "#fecaca" }}
                    >
                      Delete
                    </button>
                  </td>
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
