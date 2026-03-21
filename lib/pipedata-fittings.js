/**
 * Load fittings catalogs from reference Database folders (Node-only, uses fs).
 * Ftbw = butt weld, Ftsc = threaded, Ftsw = socket weld — same CSV shape as Ftbw.
 */

import fs from "fs";
import path from "path";
import { flangesDatabaseRoot } from "./flanges-config.js";

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

/**
 * @param {string} subfolder — e.g. "Ftbw", "Ftsc", "Ftsw"
 * @param {string} connectionLabel — attributes.connectionType
 * @param {string} catalogCategory — part-catalog category id for browser / filters
 */
export function loadFittingsCatalogFromFolder(subfolder, connectionLabel, catalogCategory) {
  const folder = path.join(flangesDatabaseRoot, subfolder);
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    return [];
  }

  const files = fs.readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort();
  const entries = [];

  for (const filename of files) {
    const fullPath = path.join(folder, filename);
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
      const id = `${catalogCategory}-${safeType}-${schedule}-${system}-${nps.replace(/\s+/g, "_")}`;
      entries.push({
        id,
        catalogCategory,
        partTypeLabel: typeName,
        nps,
        thickness: schedule,
        weightKg: Number.isFinite(weightKg) ? weightKg : null,
        attributes: {
          connectionType: connectionLabel,
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

  return entries;
}

/**
 * Butt weld + threaded + socket weld fittings for /catalog (merged).
 */
export function loadFittingsCatalog() {
  const butt = loadFittingsCatalogFromFolder("Ftbw", "Butt Weld", "fittings-butt-weld");
  const threaded = loadFittingsCatalogFromFolder("Ftsc", "Threaded", "fittings-threaded");
  const socket = loadFittingsCatalogFromFolder("Ftsw", "Socket Weld", "fittings-socket-weld");
  return { entries: [...butt, ...threaded, ...socket] };
}
