"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../../shared.css";

const ROLES = [
  { value: "subject_teacher", label: "Subject Teacher" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "vp_academics", label: "VP Academics" },
  { value: "vp_admin", label: "VP Admin" },
  { value: "principal", label: "Principal" },
  { value: "bursar", label: "Bursar" },
  { value: "librarian", label: "Librarian" },
  { value: "admin_staff", label: "Admin Staff" },
];

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  admission_no: string;
}

export default function EditTeacherPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "subject_teacher",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        const res = await authenticatedFetch(`/api/teachers/${id}`);
        const d = await res.json();
        const t = d.data as Teacher;
        if (t) {
          const [first, ...rest] = (t.name ?? "").split(" ");
          setForm({
            firstName: first ?? "",
            lastName: rest.join(" ") ?? "",
            email: t.email ?? "",
            phone: t.phone ?? "",
            role: t.role ?? "subject_teacher",
            avatar: t.avatar ?? "",
          });
        }
      } catch (err) {
        toast.error("Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };

    const loadAssignmentData = async () => {
      try {
        const [subjectsRes, studentsRes] = await Promise.all([
          authenticatedFetch("/api/subjects"),
          authenticatedFetch("/api/students"),
        ]);

        if (subjectsRes.ok) setSubjects((await subjectsRes.json()).data || []);
        if (studentsRes.ok) setStudents((await studentsRes.json()).data || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadTeacherData();
    loadAssignmentData();
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(s => s !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      return toast.error("First name, last name, and email are required");
    }
    setSaving(true);
    try {
      let avatar = form.avatar;
      if (avatarFile) {
        const reader = new FileReader();
        avatar = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(avatarFile);
        });
      }

      const res = await authenticatedFetch(`/api/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          avatar: avatar || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);

      // Assign subjects if any selected
      if (selectedSubjects.length > 0) {
        for (const subjectId of selectedSubjects) {
          try {
            await authenticatedFetch(`/api/subjects/${subjectId}/assign`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teacherId: id }),
            });
          } catch (err) {
            console.error("Failed to assign subject:", err);
          }
        }
      }

      toast.success("Teacher updated");
      router.push(`/teachers/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="table-empty">Loading…</div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>Edit Teacher</h1>
          <p>Update teacher information.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "2rem", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label>Teacher Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                {(form.avatar || avatarFile) && (
                  <div style={{ marginTop: "0.8rem" }}>
                    {avatarFile || form.avatar ? (
                      <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                        <img
                          src={avatarFile ? URL.createObjectURL(avatarFile) : form.avatar}
                          alt="preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ) : null}
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                      {avatarFile ? "New image selected" : "Current image"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Subject Assignments</div>
          {loadingData ? (
            <div style={{ padding: "1rem", color: "#64748b" }}>Loading subjects...</div>
          ) : subjects.length > 0 ? (
            <div className="assignment-checklist">
              {subjects.map((subject) => (
                <label key={subject.id} className="assignment-item">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                  />
                  <span>{subject.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ padding: "1rem", color: "#94a3b8" }}>No subjects available</div>
          )}

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Student Assignments</div>
          {loadingData ? (
            <div style={{ padding: "1rem", color: "#64748b" }}>Loading students...</div>
          ) : students.length > 0 ? (
            <div className="assignment-checklist">
              {students.map((student) => (
                <label key={student.id} className="assignment-item">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <span>{student.name} {student.admission_no ? `(${student.admission_no})` : ""}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ padding: "1rem", color: "#94a3b8" }}>No students available</div>
          )}

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
