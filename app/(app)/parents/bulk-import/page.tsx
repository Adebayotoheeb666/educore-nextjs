"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils/fetch";
import "../../shared.css";

interface ImportResult {
  successful: number;
  created: number;
  linked: number;
  failed: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  defaultPassword?: string;
  createdParents?: Array<{ email: string | null; linked: boolean }>;
}

export default function ParentBulkImportPage() {
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

      const res = await authenticatedFetch("/api/parents/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setResult(data.data ?? data);
      toast.success(
        `${data.data?.successful || data.successful || 0} parents imported successfully (${data.data?.linked || data.linked || 0} linked to students)`,
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
          href="/parents"
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
          ← Back to Parents
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          Bulk Import Parents
        </h1>
        <p style={{ fontSize: "1.5rem", color: "#64748b" }}>
          Upload a CSV file to import multiple parents at once and link them to students. Required columns:{" "}
          <strong>FULL_NAME</strong> and either <strong>EMAIL or PHONE</strong>. Recommended:{" "}
          <strong>STUDENT_ADMISSION_NO</strong> for linking to students.
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
            href="/api/parents/bulk-import/template"
            download="parents_template.csv"
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
{`FULL_NAME,EMAIL,PHONE,STUDENT_ADMISSION_NO,STUDENT_EMAIL,RELATIONSHIP
Mrs. Ngozi Okafor,ngozi@email.com,09012345678,ADM001,,Mother
Mr. Adeyemi Hassan,adeyemi@email.com,09087654321,ADM002,,Father
Mrs. Amara Oluwaseun,amara@email.com,08123456789,ADM003,,Mother
Dr. Folake Ajayi,,09156789012,ADM004,,Father
Ms. Tunde Obi,tunde@email.com,,ADM005,,Mother`}
            </pre>
          </div>

          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: "1.2rem", color: "#92400e" }}>
              <strong>💡 Tips:</strong> 
              <br />
              • STUDENT_ADMISSION_NO (recommended): Directly links parent to student using admission number
              <br />
              • STUDENT_EMAIL (fallback): Links parent to student if admission number not found
              <br />
              • Either EMAIL or PHONE is required (you can provide both, or just one)
              <br />
              • RELATIONSHIP options: Mother, Father, Guardian, Uncle, Aunt, Grandparent, etc.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/parents" className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={uploading || !file}>
              {uploading ? "Importing…" : "Import Parents"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div style={{ marginTop: "3rem" }}>
          <div
            style={{
              padding: "2rem",
              background: result.failed === 0 ? "#f0fdf4" : "#fef3c7",
              border: `1px solid ${result.failed === 0 ? "#bbf7d0" : "#fcd34d"}`,
              borderRadius: 8,
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ fontSize: "2rem", marginTop: 0 }}>📊 Import Results</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem", background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "0.5rem" }}>Created</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#16a34a" }}>{result.successful || 0}</div>
              </div>
              <div style={{ padding: "1rem", background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "0.5rem" }}>Linked to Students</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2563eb" }}>{result.linked || 0}</div>
              </div>
              <div style={{ padding: "1rem", background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "0.5rem" }}>Failed</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#dc2626" }}>{result.failed || 0}</div>
              </div>
            </div>

            {result.defaultPassword && (
              <div style={{ padding: "1rem", background: "#fff", borderRadius: 6, marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>Default Password for New Parents:</p>
                <code style={{ padding: "0.5rem 1rem", background: "#f5f5f5", borderRadius: 4, display: "inline-block" }}>
                  {result.defaultPassword}
                </code>
              </div>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.8rem", color: "#dc2626", marginBottom: "1rem" }}>❌ Errors ({result.errors.length})</h3>
              <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ padding: "0.5rem", borderBottom: i < result.errors.length - 1 ? "1px solid #fedede" : "none" }}>
                    <strong>Row {err.row}:</strong> {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div>
              <h3 style={{ fontSize: "1.8rem", color: "#ea580c", marginBottom: "1rem" }}>⚠️ Warnings ({result.warnings.length})</h3>
              <div style={{ padding: "1rem", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8 }}>
                {result.warnings.map((warn, i) => (
                  <div key={i} style={{ padding: "0.5rem", borderBottom: i < result.warnings.length - 1 ? "1px solid #fde68a" : "none" }}>
                    <strong>Row {warn.row}:</strong> {warn.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
