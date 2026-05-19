const fs = require("fs");
const schemaPath = "/home/adebayo/Desktop/Educore/educore-nextjs/lib/db/schema.sql";
const schemaSql = fs.readFileSync(schemaPath, "utf-8");

// Remove comment lines
const cleanSql = schemaSql
  .split("\n")
  .map((line) => (line.trim().startsWith("--") ? "" : line))
  .join("\n");

const rawStatements = cleanSql.split(";");
console.log(`Raw statements count: ${rawStatements.length}`);

const statements = rawStatements
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Filtered statements count: ${statements.length}`);
console.log("=== First 5 statements ===");
for (let i = 0; i < Math.min(5, statements.length); i++) {
  console.log(`\n--- Statement ${i} ---`);
  console.log(statements[i]);
}
