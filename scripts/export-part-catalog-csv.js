/**
 * Build data/part-catalog-review.csv from data/part-catalog.json for manual review.
 * Run from project root: node scripts/export-part-catalog-csv.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const jsonPath = path.join(projectRoot, "data", "part-catalog.json");
const outPath = path.join(projectRoot, "data", "part-catalog-review.csv");

const raw = fs.readFileSync(jsonPath, "utf8");
const { categories = [], entries = [] } = JSON.parse(raw);
const labelById = new Map(categories.map((c) => [c.id, c.label]));

function toCsvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

const headers = [
  "catalogPartId",
  "catalogCategory",
  "categoryLabel",
  "partTypeLabel",
  "nps",
  "thickness",
  "weightKg",
  "surfaceM2",
  "attributesJson",
];

const rows = [headers.join(",")];
for (const entry of entries) {
  const row = [
    entry.catalogPartId,
    entry.catalogCategory,
    labelById.get(entry.catalogCategory) ?? "",
    entry.partTypeLabel ?? "",
    entry.nps ?? "",
    entry.thickness ?? "",
    entry.weightKg ?? "",
    entry.surfaceM2 ?? "",
    JSON.stringify(entry.attributes ?? {}),
  ];
  rows.push(row.map(toCsvCell).join(","));
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, rows.join("\n"));

console.log(`Wrote ${outPath} (${entries.length} entries).`);
