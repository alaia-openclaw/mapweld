/**
 * Build part-catalog.json from 3CQC reference data (.co1, .set, .csv).
 * Run from project root: node scripts/build-part-catalog.js
 * Optional: node scripts/build-part-catalog.js "path/to/3CQC ref/3CQC-main/DATA/Pipe Data"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const CATEGORY_LABELS = {
  WBPI: "Pipe",
  WBOL: "Olet",
  VLFL: "Valve (Flanged)",
  VLSC: "Valve (Threaded)",
  VLSW: "Valve (Socket Weld)",
  VLBW: "Valve (Butt Weld)",
};

const CATEGORY_ORDER = ["WBPI", "WBOL", "VLFL", "VLSC", "VLSW", "VLBW"];

function getDataRoot() {
  const arg = process.argv[2];
  if (arg) return path.resolve(process.cwd(), arg);
  return path.join(projectRoot, "3CQC ref", "3CQC-main", "DATA", "Pipe Data");
}

function readCo1(dir, categoryId) {
  const co1Name =
    categoryId.charAt(0) + categoryId.slice(1).toLowerCase() + ".co1";
  const co1Path = path.join(dir, co1Name);
  if (!fs.existsSync(co1Path)) return [];
  const content = fs.readFileSync(co1Path, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const partTypes = [];
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/"([^"]+)"/);
    if (m) partTypes.push(m[1].trim());
  }
  return partTypes;
}

function parseCsvLine(line) {
  const result = [];
  let inQuotes = false;
  let field = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (c === "," || c === "\t")) {
      result.push(field.trim());
      field = "";
    } else {
      field += c;
    }
  }
  result.push(field.trim());
  return result;
}

function findColumnIndex(header, patterns) {
  const lower = header.map((h) => h.toLowerCase());
  for (const p of patterns) {
    const i = lower.findIndex((h) => p.test(h));
    if (i >= 0) return i;
  }
  return -1;
}

function findWeightColumnIndex(header) {
  return findColumnIndex(header, [
    /wtkg|wt\/kg|^kg$|^wt$/,
  ]);
}

function findNpsColumnIndex(header) {
  return findColumnIndex(header, [
    /^in$|^ins$|nb\s*inche|^nps$|^nb$/,
  ]);
}

function parseNps(value) {
  if (!value || value === "N/A") return null;
  const v = String(value).trim();
  if (/^\d+(\+\d+\/\d+)?$/.test(v)) return v;
  const num = parseFloat(v);
  if (Number.isFinite(num)) return String(num);
  return v;
}

function parseWeight(value) {
  if (!value || value === "N/A" || value === "") return null;
  const n = parseFloat(String(value).replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

function extractThicknessFromFilename(filename) {
  const base = path.basename(filename, ".csv");
  const match = base.match(/_([A-Z0-9#]+)$/i) || base.match(/(STD|XS|XXS|160|80|40|20|10|150|300|600|900|1500|2500|3000|6000|9000)$/i);
  return match ? match[1].toUpperCase() : null;
}

function extractPartTypeIndexFromFilename(filename, category) {
  const base = path.basename(filename, ".csv");
  const numMatch = base.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 1;
}

function processCsvFile(filePath, category, partTypes, categoryDir) {
  const filename = path.basename(filePath);
  const thicknessFromFile = extractThicknessFromFilename(filename);
  const partTypeIndex = extractPartTypeIndexFromFilename(filename, category);
  const partTypeLabel = partTypes[partTypeIndex - 1] || `Type ${partTypeIndex}`;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  let headerRowIndex = -1;
  let header = [];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const row = parseCsvLine(lines[i]);
    const npsCol = findNpsColumnIndex(row);
    if (npsCol >= 0) {
      headerRowIndex = i;
      header = row;
      break;
    }
  }
  if (headerRowIndex < 0) return [];

  const npsCol = findNpsColumnIndex(header);
  const weightCol = findWeightColumnIndex(header);
  if (npsCol < 0) return [];

  const thickness = thicknessFromFile || "—";
  const entries = [];
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const npsVal = row[npsCol];
    const nps = parseNps(npsVal);
    if (!nps) continue;
    let weightKg = null;
    if (weightCol >= 0 && row[weightCol] !== undefined) {
      weightKg = parseWeight(row[weightCol]);
    }
    if (weightKg === null && weightCol < 0) {
      for (let c = 0; c < row.length; c++) {
        if (/wtkg|wt\/kg|^kg$/i.test(header[c] || "")) {
          weightKg = parseWeight(row[c]);
          break;
        }
      }
    }
    const catalogPartId = [
      category,
      partTypeIndex,
      nps.replace(/\+/g, "-"),
      thickness,
    ]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "_");
    entries.push({
      catalogPartId,
      catalogCategory: category,
      partTypeLabel,
      nps,
      thickness,
      weightKg,
      surfaceM2: null,
    });
  }
  return entries;
}

function buildCatalog(dataRoot) {
  const catalog = {
    categories: CATEGORY_ORDER.filter((id) => {
      const dir = path.join(dataRoot, id);
      return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    }).map((id) => ({
      id,
      label: CATEGORY_LABELS[id] || id,
    })),
    entries: [],
  };

  if (!fs.existsSync(dataRoot) || !fs.statSync(dataRoot).isDirectory()) {
    return catalog;
  }

  for (const category of catalog.categories) {
    const categoryDir = path.join(dataRoot, category.id);
    const partTypes = readCo1(categoryDir, category.id);
    const files = fs.readdirSync(categoryDir);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".csv")) continue;
      const filePath = path.join(categoryDir, f);
      if (!fs.statSync(filePath).isFile()) continue;
      const entries = processCsvFile(filePath, category.id, partTypes, categoryDir);
      catalog.entries.push(...entries);
    }
  }

  return catalog;
}

function main() {
  const dataRoot = getDataRoot();
  const outPath = path.join(projectRoot, "data", "part-catalog.json");
  const catalog = buildCatalog(dataRoot);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`Wrote ${catalog.entries.length} catalog entries to ${outPath}`);
}

main();
