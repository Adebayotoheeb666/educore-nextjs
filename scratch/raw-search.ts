import { readFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../migrations/export/User.json");
const text = readFileSync(filePath, "utf-8");

const index = text.toLowerCase().indexOf("fvs");
if (index !== -1) {
  console.log(`Found 'fvs' at index ${index}.`);
  console.log("Context:", text.slice(Math.max(0, index - 100), Math.min(text.length, index + 100)));
} else {
  console.log("'fvs' not found in raw text.");
}
