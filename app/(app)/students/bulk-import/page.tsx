"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ImportResult {
  successful: number;
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      return toast.error("Please select a file");
    }

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        return toast.error("CSV file is empty or invalid");
      }

      const res = await authenticatedFetch("/api/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setResult(data.data ?? data);
      toast.success(
        `${data.data?.successful || data.successful || 0} students imported successfully`,
        { duration: 5000 }
      );
      setFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Link
          href="/students"
          style={{
            textDecoration: "none",
            color: "#64748b",
            fontSize: "1.4rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
        >
          ← Back to Students
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          Bulk Import Students
        </h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Upload a CSV file to import multiple students at once. Required columns:{" "}
          <strong>FULL_NAME, EMAIL</strong>. Optional: GENDER, CLASS_GRADE, PARENT_PHONE, STUDENT_ID
        </p>
      </div>

      <div className="form-card">
        <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: "1.3rem", marginBottom: "1rem", fontWeight: 600, color: "#166534" }}>
            📥 Get Started Quickly
          </p>
          <p style={{ margin: 0, color: "#166534", fontSize: "1.2rem", marginBottom: "1rem" }}>
            Download our CSV template with sample data to see the correct format.
          </p>
          <a
            href="/api/students/bulk-import/template"
            download="students_template.csv"
            className="btn-primary"
            style={{ display: "inline-block", padding: "0.8rem 1.6rem", textDecoration: "none" }}
          >
            📋 Download Template
          </a>
        </div>

        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>CSV File *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
              style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: 8 }}
            />
            {file && (
              <p style={{ margin: "0.5rem 0 0", color: "#16a34a", fontSize: "1.2rem" }}>
                ✓ {file.name}
              </p>
            )}
          </div>

          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: "1.5rem",
              marginBottom: "2rem",
              fontSize: "1.2rem",
            }}
          >
            <p style={{ margin: "0 0 1rem" }}>
              <strong>📋 CSV Format:</strong>
            </p>
            <pre
              style={{
                background: "#fff",
                padding: "1rem",
                borderRadius: 4,
                overflow: "auto",
                margin: 0,
              }}
            >
{`FULL_NAME,EMAIL,GENDER,CLASS_GRADE,PARENT_PHONE
Chinelo Okafor,chinelo@school.com,Female,JSS 1,09012345678
Obinna Adeyemi,obinna@school.com,Male,JSS 2,`}
            </pre>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/students" className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={uploading || !file}>
              {uploading ? "Importing…" : "Import Students"}
            </button>
          </div>
        </form>

        {result && (
          <div
            style={{
              marginTop: "3rem",
              padding: "2rem",
              background: "#f8fafc",
              borderRadius: 12,
              borderTop: "2px solid #e2e8f0",
            }}
          >
            <h3 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Import Summary
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <p style={{ color: "#64748b", fontSize: "1.2rem", margin: 0 }}>
                  Successful
                </p>
                <p
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 800,
                    color: "#22c55e",
                    margin: 0,
                  }}
                >
                  {result.successful}
                </p>
              </div>
              <div>
                <p style={{ color: "#64748b", fontSize: "1.2rem", margin: 0 }}>
                  Failed
                </p>
                <p
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 800,
                    color: "#ef4444",
                    margin: 0,
                  }}
                >
                  {result.failed}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.8rem" }}>
                  Errors ({result.errors.length}):
                </p>
                <div
                  style={{
                    maxHeight: 300,
                    overflow: "auto",
                    background: "#fff",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "1rem",
                  }}
                >
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "1.2rem",
                        padding: "0.5rem 0",
                        borderBottom: i < result.errors.length - 1 ? "1px solid #fee2e2" : "none",
                        color: "#7f1d1d",
                      }}
                    >
                      <strong>Row {e.row}:</strong> {e.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.8rem" }}>
                  Warnings ({result.warnings.length}):
                </p>
                <div
                  style={{
                    maxHeight: 300,
                    overflow: "auto",
                    background: "#fff",
                    border: "1px solid #fcd34d",
                    borderRadius: 8,
                    padding: "1rem",
                  }}
                >
                  {result.warnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "1.2rem",
                        padding: "0.5rem 0",
                        borderBottom: i < result.warnings.length - 1 ? "1px solid #fef3c7" : "none",
                        color: "#92400e",
                      }}
                    >
                      <strong>Row {w.row}:</strong> {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
