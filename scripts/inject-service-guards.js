#!/usr/bin/env node
/**
 * Injects useServiceGuard into the top-level page of every optional service.
 * Safe to run multiple times — skips files that already have the guard.
 */
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..", "app", "(app)");

// Map of page file (relative to BASE) → serviceSlug
const PAGES = {
  "subjects/page.tsx":          "subjects",
  "attendance/page.tsx":        "attendance",
  "exams/page.tsx":             "exams",
  "results/page.tsx":           "results",
  "broadsheet/page.tsx":        "results",
  "fees/schedules/page.tsx":    "fees",
  "fees/collection/page.tsx":   "fees",
  "fees/defaulters/page.tsx":   "fees",
  "lesson-plans/page.tsx":      "lesson-plans",
  "timetable/page.tsx":         "timetable",
  "library/page.tsx":           "library",
  "announcements/page.tsx":     "announcements",
  "analytics/page.tsx":         "analytics",
  "feedback/page.tsx":          "feedback",
};

const IMPORT_LINE = `import { useServiceGuard } from "@/lib/hooks/useServiceGuard";`;

let patched = 0;
let skipped = 0;

for (const [rel, slug] of Object.entries(PAGES)) {
  const fullPath = path.join(BASE, rel);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Not found: ${rel}`);
    continue;
  }

  let src = fs.readFileSync(fullPath, "utf8");

  // Skip if already guarded
  if (src.includes("useServiceGuard")) {
    console.log(`✅ Already guarded: ${rel}`);
    skipped++;
    continue;
  }

  // 1. Add import after the last existing import line
  // Find the last import statement
  const importRegex = /^import\s+.+from\s+['"].+['"];?\s*$/gm;
  let lastImportIdx = -1;
  let match;
  while ((match = importRegex.exec(src)) !== null) {
    lastImportIdx = match.index + match[0].length;
  }

  if (lastImportIdx === -1) {
    console.log(`⚠️  No imports found in: ${rel} — skipping`);
    continue;
  }

  src = src.slice(0, lastImportIdx) + "\n" + IMPORT_LINE + src.slice(lastImportIdx);

  // 2. Find the default export function body and inject the guard call.
  //    Look for the first `export default function` or `export default function Xxx`
  //    and then find the opening `{` to insert after.
  const GUARD_CALL = `\n  const { loading: _svcLoading, allowed: _svcAllowed } = useServiceGuard("${slug}");\n  if (_svcLoading || !_svcAllowed) return null;\n`;

  // Match: export default function Xxx(...) {
  const fnMatch = src.match(/export\s+default\s+function\s+\w*\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/);
  if (!fnMatch) {
    console.log(`⚠️  Could not find default export function in: ${rel} — skipping body injection`);
    skipped++;
    continue;
  }

  const insertAt = src.indexOf(fnMatch[0]) + fnMatch[0].length;
  src = src.slice(0, insertAt) + GUARD_CALL + src.slice(insertAt);

  fs.writeFileSync(fullPath, src, "utf8");
  console.log(`🔒 Guarded (${slug}): ${rel}`);
  patched++;
}

console.log(`\nDone. ${patched} files patched, ${skipped} skipped.`);
