import { readFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../migrations/export/User.json");
const data = JSON.parse(readFileSync(filePath, "utf-8"));

const results = data.filter((user: any) => 
  (user.email && user.email.toLowerCase().includes("admin.ng"))
);

console.log("Found matching users:");
console.log(JSON.stringify(results, null, 2));
