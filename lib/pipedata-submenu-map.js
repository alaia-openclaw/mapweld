import fs from "fs";
import path from "path";

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

export function loadPipedataSubmenuMapRows() {
  const mapPath = path.join(process.cwd(), "docs", "pipedata-submenu-file-map.csv");
  if (!fs.existsSync(mapPath)) return [];
  const raw = fs.readFileSync(mapPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = cols[idx] ?? "";
    });
    return row;
  });
}
