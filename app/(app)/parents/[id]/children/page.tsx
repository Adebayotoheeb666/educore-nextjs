"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

interface Student {
  id: string;
  name: string;
  admission_no?: string;
  email?: string;
}

interface Parent {
  name: string;
}

const PAGE_SIZE = 15;

export default function ParentChildrenPage() {
  const { id } = useParams<{ id: string }>();
  const [parent, setParent] = useState<Parent | null>(null);
  const [linkedChildren, setLinkedChildren] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      authenticatedFetch(`/api/parents/${id}`).then((r) => r.json()),
      authenticatedFetch(`/api/parents/${id}/children`).then((r) => r.json()),
      authenticatedFetch("/api/students").then((r) => r.json()),
    ])
      .then(([pd, cd, sd]) => {
        setParent(pd.data);
        setLinkedChildren(Array.isArray(cd.data) ? cd.data : []);
        const linked = new Set((cd.data || []).map((c: Student) => c.id));
        const available = Array.isArray(sd.data)
          ? (sd.data as Student[]).filter((s) => !linked.has(s.id))
          : [];
        setAvailableStudents(available);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredAvailable = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return availableStudents;
    return availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.admission_no ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [availableStudents, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAvailable.length / PAGE_SIZE));
  const paginated = filteredAvailable.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleLink = async (studentId: string) => {
    setLinking(studentId);
    try {
      const res = await authenticatedFetch("/api/parents/assign-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: id, studentId }),
      });
      if (!res.ok) throw new Error();
      setLinkedChildren((prev) => [
        ...prev,
        availableStudents.find((s) => s.id === studentId)!,
      ]);
      setAvailableStudents((prev) => prev.filter((s) => s.id !== studentId));
      toast.success("Student linked");
    } catch {
      toast.error("Failed to link student");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (studentId: string) => {
    setUnlinking(studentId);
    try {
      const res = await authenticatedFetch("/api/parents/unlink-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: id, studentId }),
      });
      if (!res.ok) throw new Error();
      const unlinked = linkedChildren.find((c) => c.id === studentId);
      setLinkedChildren((prev) => prev.filter((c) => c.id !== studentId));
      if (unlinked) setAvailableStudents((prev) => [...prev, unlinked]);
      toast.success("Student unlinked");
    } catch {
      toast.error("Failed to unlink student");
    } finally {
      setUnlinking(null);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;
  if (!parent) return <div className="table-empty">Parent not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href={`/parents/${id}`} style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to {parent.name}
        </Link>
      </div>

      <div style={{ marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Manage Children</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Link and manage students for {parent.name}
        </p>
      </div>

      {/* Linked Children */}
      <div style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Linked Children ({linkedChildren.length})
        </h2>
        <div className="premium-table-card">
          {linkedChildren.length === 0 ? (
            <div className="table-empty">No children linked to this parent yet.</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission No.</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedChildren.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="info-cell">
                        <div className="avatar-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`}
                            alt=""
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{c.name}</span>
                      </div>
                    </td>
                    <td><span className="mono">{c.admission_no ?? "—"}</span></td>
                    <td>{c.email ?? "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/students/${c.id}`} className="link-action">View</Link>
                        <button
                          className="btn-danger-sm"
                          onClick={() => handleUnlink(c.id)}
                          disabled={unlinking === c.id}
                        >
                          {unlinking === c.id ? "…" : "Unlink"}
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

      {/* Available Students */}
      <div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Available Students
        </h2>
        <div className="filter-bar" style={{ marginBottom: "1.5rem" }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, admission no., or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="premium-table-card">
          {availableStudents.length === 0 ? (
            <div className="table-empty">
              {search
                ? "No students match your search."
                : "All students are already linked to this parent."}
            </div>
          ) : paginated.length === 0 ? (
            <div className="table-empty">No students match your search.</div>
          ) : (
            <>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Admission No.</th>
                    <th>Email</th>
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
                          <span style={{ fontWeight: 700, fontSize: "1.4rem" }}>{s.name}</span>
                        </div>
                      </td>
                      <td><span className="mono">{s.admission_no ?? "—"}</span></td>
                      <td>{s.email ?? "—"}</td>
                      <td>
                        <button
                          className="link-action"
                          onClick={() => handleLink(s.id)}
                          disabled={linking === s.id}
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                          {linking === s.id ? "…" : "Link"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAvailable.length > PAGE_SIZE && (
                <div className="table-pagination">
                  <span>
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredAvailable.length)} of{" "}
                    {filteredAvailable.length} students
                  </span>
                  <div className="pag-buttons">
                    <button
                      className="pag-btn"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ‹
                    </button>
                    {Array.from(
                      { length: Math.min(totalPages, 7) },
                      (_, i) => i + 1
                    ).map((p) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
