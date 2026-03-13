/**
 * Load butt-weld fittings catalog from Pipedata-Pro 15.0 Database/Ftbw (Node-only, uses fs).
 * Used by build-part-catalog-pipedata.js only.
 */

import fs from "fs";
import path from "path";
import { flangesDatabaseRoot } from "./flanges-config.js";

const ftbwFolder = path.join(flangesDatabaseRoot, "Ftbw");

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

function getHeaderRow(lines) {
  if (lines.length < 2) return { header: [], startIndex: 0 };
  const row0 = parseCsvLine(lines[0]);
  const row1 = parseCsvLine(lines[1]);
  const hasHeader = /nb|nps|od|wt/i.test(row1.join(" "));
  const header = hasHeader ? row1 : row0;
  const startIndex = hasHeader ? 2 : 1;
  return { header, startIndex };
}

function extractFittingTypeAndSchedule(filename) {
  const base = path.basename(filename, ".csv");
  const imperial = /_Imperial_/i.test(base);
  const rest = base.replace(/_Imperial_?/i, "_").replace(/_/g, " ");
  const scheduleMatch = rest.match(/\s*(?:Imperial\s*)?(\d+S?|STD|XS|XXS|10|20|30|40|80|60|100|120|140|160)$/i);
  const schedule = scheduleMatch ? scheduleMatch[1].trim() : "STD";
  let typeName = rest;
  if (scheduleMatch) typeName = rest.slice(0, scheduleMatch.index).trim();
  typeName = typeName.replace(/\s+/g, " ");
  let angle = null;
  let radius = "Long";
  if (/90\s*Elbow|90Elbow/i.test(base)) {
    angle = "90";
    radius = "Long";
  } else if (/45\s*Elbow|45Elbow/i.test(base)) {
    angle = "45";
    radius = "Long";
  } else if (/Short\s*Radius|ShortRadius/i.test(base)) {
    radius = "Short";
    angle = /90/i.test(base) ? "90" : /45/i.test(base) ? "45" : null;
  }
  return { typeName, schedule, angle, radius, imperial };
}

export function loadFittingsCatalog() {
  if (!fs.existsSync(ftbwFolder) || !fs.statSync(ftbwFolder).isDirectory()) {
    return { entries: [] };
  }

  const files = fs.readdirSync(ftbwFolder)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort();
  const entries = [];

  for (const filename of files) {
    const fullPath = path.join(ftbwFolder, filename);
    const { typeName, schedule, angle, radius, imperial } = extractFittingTypeAndSchedule(filename);
    const system = imperial ? "Imperial" : "Metric";

    const raw = fs.readFileSync(fullPath, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) continue;

    const { header, startIndex } = getHeaderRow(lines);
    const nbCol = header.findIndex((h) => /^nb$|^nps$/i.test(h));
    const odCol = header.findIndex((h) => /^od$/i.test(h));
    const wtCol = header.findIndex((h) => /^wt$|weight/i.test(h));
    const useNbCol = nbCol >= 0 ? nbCol : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const nps = (row[useNbCol] || "").trim();
      if (!nps || nps.toUpperCase() === "N/A") continue;

      const od = odCol >= 0 ? row[odCol] : undefined;
      const wt = wtCol >= 0 ? row[wtCol] : undefined;
      const weightKg = wt != null && wt !== "" && wt.toUpperCase() !== "N/A" ? parseFloat(String(wt).replace(/,/g, ".")) : null;

      const safeType = typeName.replace(/\s+/g, "-").replace(/,/g, "");
      const id = `fittings-butt-weld-${safeType}-${schedule}-${system}-${nps.replace(/\s+/g, "_")}`;
      entries.push({
        id,
        catalogCategory: "fittings-butt-weld",
        partTypeLabel: typeName,
        nps,
        thickness: schedule,
        weightKg: Number.isFinite(weightKg) ? weightKg : null,
        attributes: {
          connectionType: "Butt Weld",
          fittingType: typeName,
          schedule,
          system,
          angle: angle ?? undefined,
          radius,
          od,
        },
      });
    }
  }

  return { entries };
}
