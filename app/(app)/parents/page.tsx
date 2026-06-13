"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../shared.css";

interface Parent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  children_count?: number;
  created_at?: string;
  avatar?: string;
}

const PAGE_SIZE = 15;

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    authenticatedFetch("/api/parents")
      .then((r) => r.json())
      .then((d) => setParents(Array.isArray(d.data) ? d.data : []))
      .catch(() => toast.error("Failed to load parents"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return parents;
    return parents.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").includes(q)
    );
  }, [parents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Parents</h1>
          <p>Manage parent profiles and their children&apos;s linkage.</p>
        </div>
        <div className="header-actions">
          <Link href="/parents/bulk-import" className="btn-outline">
            <span>📤</span> Bulk Import
          </Link>
          <Link href="/parents/add" className="btn-primary">
            <span>+</span> Add Parent
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
          <div className="table-empty">Loading parents…</div>
        ) : paginated.length === 0 ? (
          <div className="table-empty">
            {parents.length === 0 ? "No parents found." : "No parents match your search."}
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Children</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="info-cell">
                      <div className="avatar-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`}
                          alt=""
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.email ?? "—"}</td>
                  <td>{p.phone ?? "—"}</td>
                  <td>
                    <span className="badge badge-blue">{p.children_count ?? 0}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/parents/${p.id}`} className="link-action">View</Link>
                      <Link href={`/parents/${p.id}/children`} className="link-action">Children</Link>
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
              {filtered.length} parents
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
