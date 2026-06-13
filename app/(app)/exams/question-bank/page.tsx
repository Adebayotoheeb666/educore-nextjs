"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { ServiceGate } from "@/lib/components/ServiceGate";
import "../../shared.css";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
  { value: "true_false", label: "True/False" },
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const BLOOM_LEVELS = [
  { value: "knowledge", label: "Knowledge" },
  { value: "comprehension", label: "Comprehension" },
  { value: "application", label: "Application" },
  { value: "analysis", label: "Analysis" },
  { value: "synthesis", label: "Synthesis" },
  { value: "evaluation", label: "Evaluation" },
];

interface Question {
  id: string;
  question_text: string;
  type: string;
  difficulty: string;
  subject_id?: string;
  class_id?: string;
  subject_name?: string;
  class_name?: string;
  marks?: number;
  bloom_level?: string;
  correct_answer?: string;
  explanation?: string;
  created_at?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  section?: string;
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    subjectId: "",
    classId: "",
    type: "multiple_choice",
    difficulty: "medium",
    questionText: "",
    instructions: "",
    options: ["", "", "", ""],
    correctAnswer: "0",
    explanation: "",
    marks: "1",
    bloomLevel: "knowledge",
    tags: "",
  });

  const questionEditorRef = useRef<HTMLDivElement | null>(null);
  const instructionsEditorRef = useRef<HTMLDivElement | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    subject: "",
    class: "",
    difficulty: "",
    type: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (questionEditorRef.current && questionEditorRef.current.innerText !== form.questionText) {
      questionEditorRef.current.innerText = form.questionText || "";
    }
  }, [form.questionText]);

  useEffect(() => {
    if (instructionsEditorRef.current && instructionsEditorRef.current.innerText !== form.instructions) {
      instructionsEditorRef.current.innerText = form.instructions || "";
    }
  }, [form.instructions]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes, cRes] = await Promise.all([
        authenticatedFetch("/api/questions"),
        authenticatedFetch("/api/subjects"),
        authenticatedFetch("/api/classes"),
      ]);

      const qData = await qRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      setQuestions(Array.isArray(qData.data) ? qData.data : []);
      setSubjects(Array.isArray(sData.data) ? sData.data : []);
      setClasses(Array.isArray(cData.data) ? cData.data : []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilteredQuestions = () => {
    let filtered = questions;

    if (filters.subject) {
      filtered = filtered.filter((q) => q.subject_id === filters.subject);
    }
    if (filters.class) {
      filtered = filtered.filter((q) => q.class_id === filters.class);
    }
    if (filters.difficulty) {
      filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
    }
    if (filters.type) {
      filtered = filtered.filter((q) => q.type === filters.type);
    }

    return filtered;
  };

  const handleQuestionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadingFile(true);

    try {
      const text = await file.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (parsed && typeof parsed === "object") {
        const questionText = parsed.questionText ?? parsed.question_text ?? parsed.question ?? parsed.title ?? text;
        const instructions = parsed.instructions ?? parsed.instruction ?? "";
        const type = QUESTION_TYPES.some((t) => t.value === parsed.type) ? parsed.type : form.type;
        const difficulty = DIFFICULTY_LEVELS.some((d) => d.value === parsed.difficulty) ? parsed.difficulty : form.difficulty;
        const tags = Array.isArray(parsed.tags) ? parsed.tags.join(", ") : typeof parsed.tags === "string" ? parsed.tags : "";
        const correctAnswer = parsed.correctAnswer ?? parsed.correct_answer ?? form.correctAnswer;
        const options = Array.isArray(parsed.options)
          ? [...parsed.options, "", "", "", ""].slice(0, 4)
          : form.options;
        const explanation = parsed.explanation ?? parsed.explanation_text ?? "";
        const marks = parsed.marks !== undefined ? String(parsed.marks) : form.marks;
        const bloomLevel = BLOOM_LEVELS.some((b) => b.value === parsed.bloomLevel) ? parsed.bloomLevel : form.bloomLevel;

        setForm({
          ...form,
          questionText,
          instructions,
          type,
          difficulty,
          options,
          correctAnswer: String(correctAnswer ?? "0"),
          explanation,
          marks,
          bloomLevel,
          tags,
        });
        toast.success("Question imported from file. Review and save.");
      } else {
        setForm({
          ...form,
          questionText: text,
        });
        toast.success("Question text loaded from file.");
      }
    } catch (err) {
      toast.error("Failed to import question file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId || !form.questionText) {
      toast.error("Subject and question text are required");
      return;
    }

    try {
      const res = await authenticatedFetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: form.subjectId,
          classId: form.classId || null,
          type: form.type,
          difficulty: form.difficulty,
          questionText: form.questionText,
          instructions: form.instructions || null,
          options: form.type === "multiple_choice" ? form.options : null,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation || null,
          marks: Number(form.marks) || 1,
          bloomLevel: form.bloomLevel,
          tags: form.tags || null,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message);

      toast.success("Question added");
      setForm({
        subjectId: "",
        classId: "",
        type: "multiple_choice",
        difficulty: "medium",
        questionText: "",
        instructions: "",
        options: ["", "", "", ""],
        correctAnswer: "0",
        explanation: "",
        marks: "1",
        bloomLevel: "knowledge",
        tags: "",
      });
      setShowForm(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;

    setDeleting(id);
    try {
      const res = await authenticatedFetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeleting(null);
    }
  };

  const filteredQuestions = handleFilteredQuestions();

  return (
    <ServiceGate slug="exams">
      <div>
        <div className="page-header-row">
          <div className="page-header-text">
            <h1>Question Bank</h1>
            <p>Build and manage a reusable question library by subject and difficulty level.</p>
          </div>
          <div className="header-actions">
            <Link href="/exams" className="btn-outline">← Back to Exams</Link>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "✕ Cancel" : "+ Add Question"}
            </button>
          </div>
        </div>

        {/* Add Question Form */}
        {showForm && (
          <div className="form-card" style={{ marginBottom: "3rem" }}>
            <h2 className="form-section-title">Add New Question</h2>
            <form onSubmit={handleAddQuestion}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Class (Optional)</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  >
                    <option value="">All classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `${c.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Question Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty *</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    {DIFFICULTY_LEVELS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marks</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Bloom Level</label>
                  <select
                    value={form.bloomLevel}
                    onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}
                  >
                    {BLOOM_LEVELS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Import question file</label>
                <input
                  type="file"
                  accept=".json,.txt,.md,text/plain,application/json,text/markdown"
                  onChange={handleQuestionFileUpload}
                />
                {uploadedFileName && (
                  <p className="input-hint">Loaded file: {uploadedFileName}</p>
                )}
              </div>

              <div className="form-group">
                <label>Question *</label>
                <div
                  ref={questionEditorRef}
                  className="document-editor"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Question editor"
                  onInput={(e) =>
                    setForm({ ...form, questionText: (e.currentTarget as HTMLDivElement).innerText })
                  }
                  data-placeholder="Write the question as if you are editing a document. Use paragraphs, lists, and paste content from an existing file."
                />
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <div
                  ref={instructionsEditorRef}
                  className="document-editor document-editor--small"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Question instructions editor"
                  onInput={(e) =>
                    setForm({ ...form, instructions: (e.currentTarget as HTMLDivElement).innerText })
                  }
                  data-placeholder="Add any extra instructions or context for this question."
                />
              </div>

              {form.type === "multiple_choice" && (
                <div>
                  <h3 style={{ marginTop: "1.5rem", marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 600 }}>
                    Options
                  </h3>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="form-group" style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={String(idx)}
                          checked={form.correctAnswer === String(idx)}
                          onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                          style={{ width: "20px", height: "20px", cursor: "pointer" }}
                        />
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...form.options];
                            newOpts[idx] = e.target.value;
                            setForm({ ...form, options: newOpts });
                          }}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.type === "true_false" && (
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {["short_answer", "essay"].includes(form.type) && (
                <div className="form-group">
                  <label>Model Answer</label>
                  <textarea
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Explanation/Solution</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. algebra, equations, hard"
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="submit" className="btn-primary">
                  Save Question
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="form-card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 600 }}>
            Filter Questions
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="">All levels</option>
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Question Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All types</option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="premium-table-card">
          {loading ? (
            <div className="table-empty">Loading questions…</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="table-empty">
              {questions.length === 0
                ? "No questions in bank yet. Create your first question!"
                : "No questions match your filters."}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.95rem" }}>
                Showing {filteredQuestions.length} of {questions.length} questions
              </div>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Difficulty</th>
                    <th>Marks</th>
                    <th>Bloom Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, maxWidth: "300px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={q.question_text}
                        >
                          {q.question_text}
                        </div>
                      </td>
                      <td>{q.subject_name ?? "—"}</td>
                      <td>
                        <span className="badge badge-blue">
                          {QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            q.difficulty === "easy"
                              ? "badge-green"
                              : q.difficulty === "hard"
                              ? "badge-red"
                              : "badge-yellow"
                          }`}
                        >
                          {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                        </span>
                      </td>
                      <td>{q.marks ?? "1"}</td>
                      <td>{q.bloom_level || "—"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="link-action"
                            onClick={() => setSelectedQuestion(q)}
                            style={{ cursor: "pointer" }}
                          >
                            View
                          </button>
                          <button
                            className="link-action"
                            style={{ color: "#ef4444" }}
                            disabled={deleting === q.id}
                            onClick={() => handleDelete(q.id)}
                          >
                            {deleting === q.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Question Detail Modal */}
        {selectedQuestion && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setSelectedQuestion(null)}
          >
            <div
              className="form-card"
              style={{
                maxWidth: "600px",
                maxHeight: "80vh",
                overflow: "auto",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
                  {selectedQuestion.question_text}
                </h2>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <span className="badge badge-blue">
                    {QUESTION_TYPES.find((t) => t.value === selectedQuestion.type)?.label}
                  </span>
                  <span
                    className={`badge ${
                      selectedQuestion.difficulty === "easy"
                        ? "badge-green"
                        : selectedQuestion.difficulty === "hard"
                        ? "badge-red"
                        : "badge-yellow"
                    }`}
                  >
                    {selectedQuestion.difficulty.charAt(0).toUpperCase() +
                      selectedQuestion.difficulty.slice(1)}
                  </span>
                  {selectedQuestion.bloom_level && (
                    <span className="badge badge-gray">{selectedQuestion.bloom_level}</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  <strong>Subject:</strong> {selectedQuestion.subject_name}
                </p>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  <strong>Marks:</strong> {selectedQuestion.marks || 1}
                </p>
              </div>

              {selectedQuestion.type === "multiple_choice" && selectedQuestion.correct_answer && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Options
                  </h3>
                  <div style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.8 }}>
                    {(() => {
                      try {
                        const opts = JSON.parse(selectedQuestion.correct_answer || "[]");
                        return opts.map((opt: string, idx: number) => (
                          <p key={idx} style={{ margin: "0.5rem 0" }}>
                            {String.fromCharCode(65 + idx)}) {opt}
                          </p>
                        ));
                      } catch {
                        return <p>{selectedQuestion.correct_answer}</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {selectedQuestion.explanation && (
                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f0fdf4", borderRadius: 8 }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: 0, marginBottom: "0.5rem" }}>
                    Explanation
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b" }}>
                    {selectedQuestion.explanation}
                  </p>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={() => setSelectedQuestion(null)}
                style={{ width: "100%" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ServiceGate>
  );
}
