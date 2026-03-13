/**
 * Load pipe catalog from Pipedata-Pro 15.0 Database/Pipe (Node-only, uses fs).
 * Used by build-part-catalog-pipedata.js only.
 */

import fs from "fs";
import path from "path";
import { flangesDatabaseRoot } from "./flanges-config.js";

const pipeFolder = path.join(flangesDatabaseRoot, "Pipe");

function parseCsvLine(line) {
  const result = [];
  let inQuotes = false;
  let field = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (c === "," || c === "\t")) {
      result.push(field.trim());
      field = "";
    } else field += c;
  }
  result.push(field.trim());
  return result;
}

function extractScheduleFromFilename(filename) {
  const base = path.basename(filename, ".csv");
  const afterImperial = base.match(/_Imperial_?(.+)$/i);
  if (afterImperial) return afterImperial[1].trim();
  const afterPipe = base.replace(/^Pipe_?/i, "").replace(/^PIPE/i, "");
  return afterPipe || "STD";
}

export function loadPipeCatalog() {
  if (!fs.existsSync(pipeFolder) || !fs.statSync(pipeFolder).isDirectory()) {
    return { entries: [] };
  }

  const files = fs.readdirSync(pipeFolder)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort();
  const entries = [];

  for (const filename of files) {
    const fullPath = path.join(pipeFolder, filename);
    const schedule = extractScheduleFromFilename(filename);
    const system = /imperial/i.test(filename) ? "Imperial" : "Metric";
    const raw = fs.readFileSync(fullPath, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 3) continue;

    const headerRow = parseCsvLine(lines[0]);
    const npsCol = headerRow.findIndex((h) => /nps|nb|size/i.test(h));
    const odCol = headerRow.findIndex((h) => /^od$|outside/i.test(h));
    const wallCol = headerRow.findIndex((h) => /wall|thick/i.test(h));
    const wtCol = headerRow.findIndex((h) => /wt\s*per|weight/i.test(h));
    const idCol = headerRow.findIndex((h) => /^id$|inner/i.test(h));
    const useNpsCol = npsCol >= 0 ? npsCol : 0;

    for (let i = 2; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const nps = (row[useNpsCol] || "").trim();
      if (!nps || nps.toUpperCase() === "N/A") continue;

      const od = odCol >= 0 ? row[odCol] : undefined;
      const thickness = wallCol >= 0 ? row[wallCol] : undefined;
      const weightKg = wtCol >= 0 ? parseFloat(String(row[wtCol]).replace(/,/g, ".")) : undefined;
      const idVal = idCol >= 0 ? row[idCol] : undefined;

      const id = `pipe-${schedule}-${system}-${nps.replace(/\s+/g, "_")}`;
      entries.push({
        id,
        catalogCategory: "pipe",
        partTypeLabel: "Pipe",
        nps,
        thickness: schedule,
        weightKg: Number.isFinite(weightKg) ? weightKg : null,
        attributes: {
          schedule,
          system,
          pipeForm: "Seamless",
          od,
          wallThk: thickness,
          id: idVal,
          weightPerUnitLen: wtCol >= 0 ? row[wtCol] : undefined,
        },
      });
    }
  }

  return { entries };
}
