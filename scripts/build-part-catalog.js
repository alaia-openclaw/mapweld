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

function getDataRoot() {
  const arg = process.argv[2];
  if (arg) return path.resolve(process.cwd(), arg);
  return path.join(projectRoot, "3CQC ref", "3CQC-main", "DATA", "Pipe Data");
}

/**
 * Read a .co1 file in a category directory to infer:
 * - human-readable part type labels (ordered)
 * - an optional category label (fallback is folder name)
 */
function readCo1(dir) {
  const files = fs.readdirSync(dir).filter((f) =>
    f.toLowerCase().endsWith(".co1")
  );
  if (!files.length) {
    return { categoryLabel: path.basename(dir), partTypes: [] };
  }
  const co1Path = path.join(dir, files[0]);
  const content = fs.readFileSync(co1Path, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const partTypes = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/"([^"]+)"/);
    if (!m) continue;
    const text = m[1].trim();
    // Many .co1 files start with a numeric count on the first line; skip those.
    if (/^\d+$/.test(text)) continue;
    partTypes.push(text);
  }

  // For now we keep the folder name as category label; .co1 mostly
  // enumerates part types rather than a single category caption.
  const categoryLabel = path.basename(dir);

  return { categoryLabel, partTypes };
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

function findThicknessColumnIndex(header) {
  return findColumnIndex(header, [
    /thk|thick|thickness/,
    /schedule|sch\b/,
    /wall/,
  ]);
}

function findRatingColumnIndex(header) {
  return findColumnIndex(header, [
    /class\b/,
    /rating/,
    /\bpn\b/,
  ]);
}

function findEndTypeColumnIndex(header) {
  return findColumnIndex(header, [
    /end\s*type/,
    /\bend\b(?!\s*prep)/,
    /conn/,
  ]);
}

function findMaterialColumnIndex(header) {
  return findColumnIndex(header, [
    /material/,
    /\bmat\b|\bmatl\b/,
  ]);
}

function findLengthColumnIndex(header) {
  return findColumnIndex(header, [
    /length/,
    /\blen\b/,
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

function extractPartTypeIndexFromFilename(filename, partTypesLength) {
  const base = path.basename(filename, ".csv");
  const numMatch = base.match(/(\d+)/);
  if (!numMatch) return 1;
  const n = parseInt(numMatch[1], 10);
  // When we have explicit part types from the .co1 file, prefer to stay within
  // that range. Filenames like FLA150.csv encode pressure rating, not type
  // index, so we clamp to 1 in those cases.
  if (partTypesLength && partTypesLength > 0) {
    if (n >= 1 && n <= partTypesLength) return n;
    return 1;
  }
  // Fallback for legacy cases with no .co1 definitions.
  if (Number.isFinite(n) && n > 0) return n;
  return 1;
}

function processCsvFile(filePath, category, partTypes) {
  const filename = path.basename(filePath);
  const thicknessFromFile = extractThicknessFromFilename(filename);
  const partTypeIndex = extractPartTypeIndexFromFilename(
    filename,
    partTypes.length
  );
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
  const thicknessCol = findThicknessColumnIndex(header);
  const ratingCol = findRatingColumnIndex(header);
  const endTypeCol = findEndTypeColumnIndex(header);
  const materialCol = findMaterialColumnIndex(header);
  const lengthCol = findLengthColumnIndex(header);
  if (npsCol < 0) return [];

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

    let thickness = thicknessFromFile || "—";
    const attributes = {};

    if (thicknessCol >= 0 && row[thicknessCol] !== undefined) {
      const t = String(row[thicknessCol]).trim();
      if (t) {
        thickness = t.toUpperCase();
        attributes.schedule = t;
      }
    }
    if (ratingCol >= 0 && row[ratingCol] !== undefined) {
      const r = String(row[ratingCol]).trim();
      if (r) attributes.rating = r;
    }
    if (endTypeCol >= 0 && row[endTypeCol] !== undefined) {
      const e = String(row[endTypeCol]).trim();
      if (e) attributes.endType = e;
    }
    if (materialCol >= 0 && row[materialCol] !== undefined) {
      const m = String(row[materialCol]).trim();
      if (m) attributes.material = m;
    }
    if (lengthCol >= 0 && row[lengthCol] !== undefined) {
      const l = String(row[lengthCol]).trim();
      if (l) attributes.length = l;
    }
    if (weightKg != null) {
      attributes.weightKg = weightKg;
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
      attributes,
    });
  }
  return entries;
}

function buildCatalog(dataRoot) {
  if (!fs.existsSync(dataRoot) || !fs.statSync(dataRoot).isDirectory()) {
    return { categories: [], entries: [] };
  }

  const categoryDirs = fs
    .readdirSync(dataRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const catalog = {
    categories: [],
    entries: [],
  };

  for (const id of categoryDirs) {
    const categoryDir = path.join(dataRoot, id);
    const { categoryLabel, partTypes } = readCo1(categoryDir);
    catalog.categories.push({
      id,
      label: categoryLabel || id,
    });

    const files = fs.readdirSync(categoryDir);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".csv")) continue;
      const filePath = path.join(categoryDir, f);
      if (!fs.statSync(filePath).isFile()) continue;
      const entries = processCsvFile(filePath, id, partTypes);
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
