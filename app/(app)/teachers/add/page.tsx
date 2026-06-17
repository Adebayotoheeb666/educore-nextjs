"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { formatPhoneDisplay } from "@/lib/utils/phoneClient";
import "../../shared.css";

const ROLES = [
  { value: "subject_teacher", label: "Subject Teacher" },
  { value: "class_teacher",   label: "Class Teacher" },
  { value: "vp_academics",    label: "VP Academics" },
  { value: "vp_admin",        label: "VP Admin" },
  { value: "principal",       label: "Principal" },
  { value: "bursar",          label: "Bursar" },
  { value: "librarian",        label: "Librarian" },
  { value: "admin_staff",     label: "Admin Staff" },
];

interface Class {
  id: string;
  name: string;
  level: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  class_name?: string;
}

interface Student {
  id: string;
  name: string;
  admission_no: string;
}

export default function AddTeacherPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    role: "subject_teacher", qualification: "", specialization: "", gender: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [subjectPage, setSubjectPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [loadingData, setLoadingData] = useState(true);

  const PAGE_SIZE = 10;

  const filteredSubjects = subjects.filter((subject) => {
    const query = subjectQuery.trim().toLowerCase();
    if (!query) return true;
    return subject.name.toLowerCase().includes(query);
  });

  const filteredStudents = students.filter((student) => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return true;
    return [student.name, student.admission_no].join(" ").toLowerCase().includes(query);
  });

  const subjectPageCount = Math.max(1, Math.ceil(filteredSubjects.length / PAGE_SIZE));
  const studentPageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedSubjects = filteredSubjects.slice((subjectPage - 1) * PAGE_SIZE, subjectPage * PAGE_SIZE);
  const pagedStudents = filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE);

  useEffect(() => {
    setSubjectPage(1);
  }, [subjectQuery]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentQuery]);

  useEffect(() => {
    if (subjectPage > subjectPageCount) setSubjectPage(subjectPageCount);
  }, [subjectPageCount, subjectPage]);

  useEffect(() => {
    if (studentPage > studentPageCount) setStudentPage(studentPageCount);
  }, [studentPageCount, studentPage]);

  useEffect(() => {
    const loadData = async () => {
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
    loadData();
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || (!form.email && !form.phone)) {
      return toast.error("First name, last name, and either email or phone are required");
    }
    setSubmitting(true);
    try {
      let avatar: string | null = null;
      if (avatarFile) {
        const reader = new FileReader();
        avatar = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(avatarFile);
        });
      }

      const res = await authenticatedFetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatar: avatar || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const teacherId = data.data?.id;

      // Assign subjects if any selected
      if (teacherId && selectedSubjects.length > 0) {
        for (const subjectId of selectedSubjects) {
          try {
            await authenticatedFetch(`/api/subjects/${subjectId}/assign`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teacherId }),
            });
          } catch (err) {
            console.error("Failed to assign subject:", err);
          }
        }
      }

      toast.success(
        `Teacher added! Default password: ${data.data?.defaultPassword ?? "EduCore@YYYY"}`,
        { duration: 8000 }
      );
      router.push("/teachers");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link href="/teachers" style={{ textDecoration: "none", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.8rem" }}>
          ← Back to Teachers
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>Add New Teacher</h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Register a new staff member. A default password will be generated automatically.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Teacher Photo</div>
          <div style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>Teacher Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              {avatarFile && (
                <div style={{ marginTop: "0.8rem" }}>
                  <div style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                    Image selected
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-section-title">Personal Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Amaka" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="e.g. Eze" required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="teacher@school.ng" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} onBlur={(e) => set("phone", formatPhoneDisplay(e.target.value))} placeholder="+234 800 000 0000" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Role & Qualification</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Highest Qualification</label>
              <input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. B.Ed Mathematics" />
            </div>
            <div className="form-group">
              <label>Specialization / Subject</label>
              <input value={form.specialization} onChange={(e) => set("specialization", e.target.value)} placeholder="e.g. Mathematics, English" />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Subject Assignments</div>
          {loadingData ? (
            <div style={{ padding: "1rem", color: "#64748b" }}>Loading subjects...</div>
          ) : subjects.length > 0 ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                <input
                  type="search"
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  placeholder="Search subjects"
                  style={{ flex: 1, minWidth: 220, padding: "0.9rem 1rem", borderRadius: 12, border: "1px solid #d1d5db", background: "#f8fafc", color: "var(--text-main)" }}
                />
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {filteredSubjects.length} of {subjects.length}
                </div>
              </div>
              {filteredSubjects.length > 0 ? (
                <>
                  <div className="assignment-checklist">
                    {pagedSubjects.map((subject) => (
                      <label key={subject.id} className="assignment-item">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                        />
                        <span>
                          {subject.name}
                          {subject.code && <span style={{ color: "#94a3b8", marginLeft: "0.5rem" }}>({subject.code})</span>}
                          {subject.class_name && <span style={{ color: "#94a3b8", marginLeft: "0.5rem" }}>• {subject.class_name}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {subjectPageCount > 1 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                      <button type="button" className="btn-secondary" disabled={subjectPage === 1} onClick={() => setSubjectPage((page) => page - 1)}>
                        Previous
                      </button>
                      <span style={{ alignSelf: "center", color: "#475569" }}>
                        Page {subjectPage} of {subjectPageCount}
                      </span>
                      <button type="button" className="btn-secondary" disabled={subjectPage === subjectPageCount} onClick={() => setSubjectPage((page) => page + 1)}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "1rem", color: "#94a3b8" }}>No subjects match your search.</div>
              )}
            </>
          ) : (
            <div style={{ padding: "1rem", color: "#94a3b8" }}>No subjects available</div>
          )}

          <div className="form-section-title" style={{ marginTop: "2rem" }}>Student Assignments</div>
          {loadingData ? (
            <div style={{ padding: "1rem", color: "#64748b" }}>Loading students...</div>
          ) : students.length > 0 ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                <input
                  type="search"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search students by name or admission number"
                  style={{ flex: 1, minWidth: 220, padding: "0.9rem 1rem", borderRadius: 12, border: "1px solid #d1d5db", background: "#f8fafc", color: "var(--text-main)" }}
                />
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {filteredStudents.length} of {students.length}
                </div>
              </div>
              {filteredStudents.length > 0 ? (
                <>
                  <div className="assignment-checklist">
                    {pagedStudents.map((student) => (
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
                  {studentPageCount > 1 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                      <button type="button" className="btn-secondary" disabled={studentPage === 1} onClick={() => setStudentPage((page) => page - 1)}>
                        Previous
                      </button>
                      <span style={{ alignSelf: "center", color: "#475569" }}>
                        Page {studentPage} of {studentPageCount}
                      </span>
                      <button type="button" className="btn-secondary" disabled={studentPage === studentPageCount} onClick={() => setStudentPage((page) => page + 1)}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "1rem", color: "#94a3b8" }}>No students match your search.</div>
              )}
            </>
          ) : (
            <div style={{ padding: "1rem", color: "#94a3b8" }}>No students available</div>
          )}

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
            <Link href="/teachers" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Adding Teacher…" : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
