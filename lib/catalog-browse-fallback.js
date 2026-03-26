/**
 * Build /catalog view data from bundled data/part-catalog.json when the Pipedata
 * reference folder (3CQC ref/...) is not present on disk.
 */

import partCatalogData from "@/data/part-catalog.json";
import { flangesStandards } from "@/lib/flanges-config.js";

const FITTINGS_PREFIX = "fittings-";

/** catalogCategory values that are not flange families */
const NON_FLANGE_CATALOG_IDS = new Set([
  "pipe",
  "fittings-butt-weld",
  "fittings-threaded",
  "fittings-socket-weld",
]);

/**
 * @returns {{ standards: object[], pipeEntries: object[], fittingsEntries: object[] }}
 */
export function loadCatalogBrowseFromPartCatalogJson() {
  const entries = partCatalogData.entries || [];

  const pipeEntries = entries
    .filter((e) => e.catalogCategory === "pipe")
    .map(mapEntryToBrowseRow);

  const fittingsEntries = entries
    .filter((e) => e.catalogCategory?.startsWith(FITTINGS_PREFIX))
    .map(mapEntryToBrowseRow);

  const standards = buildFlangeStandardsFromJson(entries);

  return { standards, pipeEntries, fittingsEntries };
}

function mapEntryToBrowseRow(e) {
  return {
    id: e.catalogPartId,
    catalogCategory: e.catalogCategory,
    partTypeLabel: e.partTypeLabel,
    nps: e.nps,
    thickness: e.thickness,
    weightKg: e.weightKg,
    attributes: e.attributes || {},
  };
}

function buildFlangeStandardsFromJson(entries) {
  const flangeEntries = entries.filter((e) => {
    const c = e.catalogCategory;
    return c && !NON_FLANGE_CATALOG_IDS.has(c) && !c.startsWith(FITTINGS_PREFIX);
  });

  const byStandardId = new Map();
  for (const e of flangeEntries) {
    const sid = e.catalogCategory;
    if (!byStandardId.has(sid)) byStandardId.set(sid, []);
    byStandardId.get(sid).push(e);
  }

  const result = [];
  for (const standard of flangesStandards) {
    const list = byStandardId.get(standard.id);
    if (!list?.length) continue;

    const byClassKey = new Map();
    for (const e of list) {
      const pc = String(e.attributes?.pressureClass ?? e.attributes?.rating ?? "—");
      const sys = e.attributes?.system || "—";
      const ck = `${standard.id}|${pc}`;
      if (!byClassKey.has(ck)) {
        byClassKey.set(ck, {
          pressureClass: pc,
          standardId: standard.id,
          datasets: [],
        });
      }
      const cls = byClassKey.get(ck);
      let ds = cls.datasets.find((d) => d.system === sys);
      if (!ds) {
        ds = { system: sys, filename: "part-catalog.json", rows: [] };
        cls.datasets.push(ds);
      }
      ds.rows.push({
        id: e.catalogPartId,
        nps: e.nps,
        thickness: e.thickness,
        od: e.attributes?.od,
        pcd: e.attributes?.pcd,
        attributes: e.attributes || {},
      });
    }

    result.push({
      ...standard,
      classes: Array.from(byClassKey.values()).sort((a, b) => {
        const na = Number(a.pressureClass);
        const nb = Number(b.pressureClass);
        if (Number.isNaN(na) || Number.isNaN(nb)) {
          return String(a.pressureClass).localeCompare(String(b.pressureClass));
        }
        return na - nb;
      }),
    });
  }

  return result;
}
