/**
 * Build data/part-catalog.json from reference database (Node-only, uses fs).
 * Run from project root: npm run build:part-catalog-pipedata
 * The built JSON is then imported by lib/part-catalog.js so the client bundle never uses fs.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFlangesCatalog } from "../lib/flanges-data.js";
import { loadPipeCatalog } from "../lib/pipedata-pipe.js";
import { loadFittingsCatalog } from "../lib/pipedata-fittings.js";
import { flangesStandards } from "../lib/flanges-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outPath = path.join(projectRoot, "data", "part-catalog.json");

const pipedataFlanges = loadFlangesCatalog();
const pipeCatalog = loadPipeCatalog();
const fittingsCatalog = loadFittingsCatalog();

const categories = [
  ...pipedataFlanges.standards.map((std) => ({ id: std.id, label: std.label })),
  { id: "pipe", label: "Pipe" },
  { id: "fittings-butt-weld", label: "Fittings (Butt Weld)" },
  { id: "fittings-threaded", label: "Fittings (Threaded)" },
  { id: "fittings-socket-weld", label: "Fittings (Socket Weld)" },
];

const entries = [];

// Flanges: for ASME B16.5 create one entry per flange subtype per row; others one per row
const b165Standard = flangesStandards.find((s) => s.id === "asme-b16-5");
const weightKeyBySubtype = {
  weldneck: "wn kg",
  "slip-on": "so kg",
  blind: "bld kg",
  threaded: "so kg",
  "socket-welded": "so kg",
  lapped: "so kg",
  "long-welding-neck": "wn kg",
};

for (const standard of pipedataFlanges.standards) {
  const subtypes = standard.subtypes || [];
  const isB165 = standard.id === "asme-b16-5";

  for (const cls of standard.classes) {
    for (const dataset of cls.datasets) {
      for (const row of dataset.rows) {
        const baseAttrs = {
          ...row.attributes,
          od: row.od,
          pcd: row.pcd,
          standardId: standard.id,
          pressureClass: cls.pressureClass,
          rating: cls.pressureClass,
          faceType: "RF",
          system: dataset.system,
        };

        if (isB165 && subtypes.length > 0) {
          for (const subtype of subtypes) {
            const weightKey = weightKeyBySubtype[subtype.id] || "wn kg";
            const weightVal = row.attributes?.[weightKey];
            const weightKg = weightVal != null ? parseFloat(String(weightVal).replace(/,/g, ".")) : null;
            const catalogPartId = `${row.id}-${subtype.id}`;
            entries.push({
              catalogPartId,
              catalogCategory: standard.id,
              partTypeLabel: subtype.label,
              nps: row.nps,
              thickness: row.thickness,
              weightKg: Number.isFinite(weightKg) ? weightKg : null,
              surfaceM2: null,
              attributes: {
                ...baseAttrs,
                flangeType: subtype.id,
                flangeTypeLabel: subtype.label,
              },
            });
          }
        } else {
          entries.push({
            catalogPartId: row.id,
            catalogCategory: standard.id,
            partTypeLabel: "Flange",
            nps: row.nps,
            thickness: row.thickness,
            weightKg: row.attributes?.weightKg ?? null,
            surfaceM2: null,
            attributes: baseAttrs,
          });
        }
      }
    }
  }
}

// Pipe
for (const e of pipeCatalog.entries) {
  entries.push({
    catalogPartId: e.id,
    catalogCategory: e.catalogCategory,
    partTypeLabel: e.partTypeLabel,
    nps: e.nps,
    thickness: e.thickness,
    weightKg: e.weightKg,
    surfaceM2: null,
    attributes: e.attributes || {},
  });
}

// Fittings (butt weld)
for (const e of fittingsCatalog.entries) {
  entries.push({
    catalogPartId: e.id,
    catalogCategory: e.catalogCategory,
    partTypeLabel: e.partTypeLabel,
    nps: e.nps,
    thickness: e.thickness,
    weightKg: e.weightKg,
    surfaceM2: null,
    attributes: e.attributes || {},
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ categories, entries }, null, 2), "utf8");
console.log(`Wrote ${entries.length} catalog entries (flanges, pipe, fittings) to ${outPath}`);
