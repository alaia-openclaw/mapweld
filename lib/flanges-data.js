import fs from "fs";
import path from "path";
import { looksLikePipeScheduleDesignation } from "./pipe-schedule-designation.js";
import { flangesDatabaseRoot, flangesStandards } from "./flanges-config.js";

const projectRoot = process.cwd();
const legacyPipeDataRoot = path.join(
  projectRoot,
  "3CQC ref",
  "3CQC-main",
  "DATA",
  "Pipe Data"
);

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

function getHeaderRow(lines) {
  if (lines.length < 2) return null;
  // Many reference CSV files start with an index row, with the true header on line 2.
  const candidate = parseCsvLine(lines[1]);
  if (candidate.length > 1) {
    return { header: candidate, startIndex: 2 };
  }
  const fallback = parseCsvLine(lines[0]);
  return { header: fallback, startIndex: 1 };
}

function findColumnIndex(header, patterns) {
  const lower = header.map((h) => String(h ?? "").trim().toLowerCase());
  for (const p of patterns) {
    const i = lower.findIndex((h) => p.test(h));
    if (i >= 0) return i;
  }
  return -1;
}

function extractPressureClassFromFilename(filename) {
  const base = path.basename(filename, ".csv");
  const match =
    base.match(/(\d+)(?=(_imperial)?$)/i) ||
    base.match(/(\d+)(?=_imperial_)/i) ||
    base.match(/(\d+)(?=$)/);
  return match ? match[1] : "—";
}

function parsePipedataCsv(filePath, standardId, pressureClass, systemLabel) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const headerInfo = getHeaderRow(lines);
  if (!headerInfo) return [];

  const { header, startIndex } = headerInfo;
  const nbCol = findColumnIndex(header, [/^nb\b/, /\bsize\b/, /^nps$/]);

  if (nbCol < 0) return [];

  /**
   * ASME pipe schedule (bore / matching pipe): same designation as Pipe and butt-weld fittings.
   * Pipedata uses "Sch", "Schedule", "Pipe Sch", etc. — never the Flan column literally named "thickness"
   * (that column is flange face / overall thickness in mm or in, not schedule).
   */
  const scheduleCol = findColumnIndex(header, [
    /^schedule$/i,
    /^sch\.?$/i,
    /^sch[-\s]?\d*$/i,
    /pipe\s*schedule/i,
    /^pipe\s*sch$/i,
    /pipe\s*wall\s*schedule/i,
    /^wall\s*schedule$/i,
    /matching\s*pipe.*schedule/i,
    /bore.*schedule/i,
  ]);
  /** Physical thickness columns only — exclude bare "wall" so we do not grab "wall schedule" as mm. */
  const thicknessCol = findColumnIndex(header, [
    /^thickness$/i,
    /^thk$/i,
    /wallthk/i,
    /^wn thk$/i,
    /^bld thk$/i,
    /^lapped thk$/i,
    /^thd thk$/i,
    /hub.*thk/i,
    /^wall\s*thickness$/i,
  ]);
  const odCol = findColumnIndex(header, [/^od\b/, /outside/]);
  const pcdCol = findColumnIndex(header, [/pcd/, /bolt\s*circle/]);

  const entries = [];

  for (let i = startIndex; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);

    const nps = (row[nbCol] || "").trim();
    if (!nps || nps.toUpperCase() === "N/A") continue;

    const scheduleFromCsv = scheduleCol >= 0 ? (row[scheduleCol] || "").trim() : "";
    const physicalThickness =
      thicknessCol >= 0 ? (row[thicknessCol] || "").trim() : "";

    const thicknessHeaderNorm =
      thicknessCol >= 0 ? String(header[thicknessCol] ?? "").trim().toLowerCase() : "";
    const isPipedataFlangeFaceThicknessColumn =
      thicknessHeaderNorm === "thickness" ||
      /^(wn|bld|lapped|thd) thk$/i.test(thicknessHeaderNorm);

    const rowKeyForId = scheduleFromCsv || physicalThickness;
    if (!rowKeyForId || rowKeyForId.toUpperCase() === "N/A") continue;

    const attributes = {};
    header.forEach((key, idx) => {
      const k = String(key ?? "").trim();
      if (!k) return;
      const value = row[idx];
      if (value == null || value === "" || value.toUpperCase?.() === "N/A") return;
      attributes[k] = value;
    });

    if (scheduleFromCsv) {
      attributes.schedule = scheduleFromCsv;
    } else if (
      physicalThickness &&
      looksLikePipeScheduleDesignation(physicalThickness) &&
      !isPipedataFlangeFaceThicknessColumn
    ) {
      attributes.schedule = physicalThickness;
    }

    const entryId = [
      standardId,
      pressureClass,
      systemLabel,
      nps.replace(/\s+/g, "_"),
      rowKeyForId.replace(/\s+/g, "_"),
    ]
      .filter(Boolean)
      .join("-");

    const od = odCol >= 0 ? row[odCol] : undefined;
    const pcd = pcdCol >= 0 ? row[pcdCol] : undefined;

    /** Part-level `thickness` is ASME pipe schedule (same as pipe / fittings), not flange face mm. */
    const scheduleForPart =
      scheduleFromCsv ||
      (attributes.schedule && String(attributes.schedule).trim()) ||
      "";

    entries.push({
      id: entryId,
      standardId,
      pressureClass,
      system: systemLabel,
      nps,
      thickness: scheduleForPart || undefined,
      od,
      pcd,
      attributes,
    });
  }

  return entries;
}

export function loadFlangesCatalog() {
  if (!fs.existsSync(flangesDatabaseRoot)) {
    return { standards: [] };
  }

  const standards = [];

  for (const standard of flangesStandards) {
    const folderPath = path.join(flangesDatabaseRoot, standard.databaseFolder);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      continue;
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".csv"))
      .sort();

    const byPressureClass = new Map();

    for (const filename of files) {
      const fullPath = path.join(folderPath, filename);
      const pressureClass = extractPressureClassFromFilename(filename);
      const systemLabel = /imperial/i.test(filename) ? "Imperial" : "Metric";

      const rows = parsePipedataCsv(
        fullPath,
        standard.id,
        pressureClass,
        systemLabel
      );

      if (!rows.length) continue;

      const key = `${pressureClass}|${standard.id}`;
      if (!byPressureClass.has(key)) {
        byPressureClass.set(key, {
          pressureClass,
          standardId: standard.id,
          datasets: [],
        });
      }

      const bucket = byPressureClass.get(key);
      bucket.datasets.push({
        system: systemLabel,
        filename,
        rows,
      });
    }

    standards.push({
      ...standard,
      classes: Array.from(byPressureClass.values()).sort((a, b) => {
        const na = Number(a.pressureClass);
        const nb = Number(b.pressureClass);
        if (Number.isNaN(na) || Number.isNaN(nb)) {
          return String(a.pressureClass).localeCompare(String(b.pressureClass));
        }
        return na - nb;
      }),
    });
  }

  return { standards };
}

