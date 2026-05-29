#!/usr/bin/env node
/**
 * Fixes the broken useServiceGuard early-return pattern (React hooks violation)
 * and replaces it with the correct <ServiceGate> wrapper component approach.
 *
 * For each page this script:
 *  1. Removes: import { useServiceGuard } from "@/lib/hooks/useServiceGuard"
 *  2. Removes: const { loading: _svcLoading, allowed: _svcAllowed } = useServiceGuard("slug")
 *  3. Removes: if (_svcLoading || !_svcAllowed) return null
 *  4. Adds:    import { ServiceGate } from "@/lib/components/ServiceGate"
 *  5. Wraps the final return(...)  with <ServiceGate slug="...">...</ServiceGate>
 */
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "..", "app", "(app)");

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

const SERVICE_GATE_IMPORT = `import { ServiceGate } from "@/lib/components/ServiceGate";`;
const OLD_IMPORT = `import { useServiceGuard } from "@/lib/hooks/useServiceGuard";`;

let fixed = 0;
let skipped = 0;

for (const [rel, slug] of Object.entries(PAGES)) {
  const fullPath = path.join(BASE, rel);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Not found: ${rel}`);
    continue;
  }

  let src = fs.readFileSync(fullPath, "utf8");

  // Already migrated
  if (src.includes("ServiceGate") && !src.includes("useServiceGuard")) {
    console.log(`✅ Already migrated: ${rel}`);
    skipped++;
    continue;
  }

  // ── Step 1: Remove old import ──────────────────────────────────
  src = src.replace(OLD_IMPORT + "\n", "");
  src = src.replace(OLD_IMPORT, "");

  // ── Step 2 & 3: Remove guard hook call + early return ─────────
  // Pattern injected was:
  //   const { loading: _svcLoading, allowed: _svcAllowed } = useServiceGuard("slug");
  //   if (_svcLoading || !_svcAllowed) return null;
  src = src.replace(
    /\n\s*const \{ loading: _svcLoading, allowed: _svcAllowed \} = useServiceGuard\("[^"]+"\);\n\s*if \(_svcLoading \|\| !_svcAllowed\) return null;\n/g,
    "\n"
  );

  // ── Step 4: Add ServiceGate import after last existing import ──
  if (!src.includes(SERVICE_GATE_IMPORT)) {
    const importRegex = /^import\s+.+from\s+['"].+['"];?\s*$/gm;
    let lastImportIdx = -1;
    let match;
    while ((match = importRegex.exec(src)) !== null) {
      lastImportIdx = match.index + match[0].length;
    }
    if (lastImportIdx !== -1) {
      src = src.slice(0, lastImportIdx) + "\n" + SERVICE_GATE_IMPORT + src.slice(lastImportIdx);
    }
  }

  // ── Step 5: Wrap the final return JSX with <ServiceGate> ───────
  // Strategy: find the LAST top-level return ( inside the default export function.
  // We look for `  return (` and replace the LAST occurrence's opening with
  //   return (<ServiceGate slug="...">
  // and insert </ServiceGate> before the closing `  );`

  // Split on the last `  return (` 
  const returnMarker = "  return (";
  const lastReturnIdx = src.lastIndexOf(returnMarker);

  if (lastReturnIdx === -1) {
    console.log(`⚠️  Could not find 'return (' in: ${rel}`);
    fs.writeFileSync(fullPath, src, "utf8");
    continue;
  }

  // Find the matching closing `);\n}` for this return
  // We walk forward counting parentheses
  let depth = 0;
  let i = lastReturnIdx + returnMarker.length - 1; // points to the '('
  let closeIdx = -1;

  for (; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") {
      depth--;
      if (depth === 0) {
        closeIdx = i;
        break;
      }
    }
  }

  if (closeIdx === -1) {
    console.log(`⚠️  Could not find matching ')' for return in: ${rel}`);
    fs.writeFileSync(fullPath, src, "utf8");
    continue;
  }

  // The segment between ( and ) is the JSX. We need to:
  // Change: return (  →  return (<ServiceGate slug="slug">
  // Insert: </ServiceGate>  before the closing )
  const beforeReturn  = src.slice(0, lastReturnIdx);
  const afterReturn   = src.slice(lastReturnIdx + returnMarker.length - 1); // from '(' onward

  // afterReturn starts with '(...jsx...)'
  // Find the closing ) index in afterReturn — it's at position (closeIdx - lastReturnIdx - returnMarker.length + 1)
  const relCloseIdx = closeIdx - lastReturnIdx - returnMarker.length + 1;

  const innerJSX  = afterReturn.slice(1, relCloseIdx); // content between ( and )
  const afterClose = afterReturn.slice(relCloseIdx + 1); // everything after )

  src = beforeReturn
    + `  return (\n    <ServiceGate slug="${slug}">`
    + innerJSX
    + `    </ServiceGate>\n  )`
    + afterClose;

  fs.writeFileSync(fullPath, src, "utf8");
  console.log(`🔒 Fixed + wrapped (${slug}): ${rel}`);
  fixed++;
}

console.log(`\nDone. ${fixed} files fixed, ${skipped} already migrated.`);
