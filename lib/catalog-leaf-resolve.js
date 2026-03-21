/**
 * Map Pipedata-style catalog tree leaf ids → part-catalog `catalogCategory` ids
 * and helpers for merged JSON + virtual rows (valves, etc.).
 */

import { partCatalog, getCatalogEntry } from "./part-catalog";
import { buildVirtualValveEntriesForLeaf } from "@/lib/catalog-virtual-valve-entries";

/** Part-catalog JSON categories that are not flange families */
const NON_FLANGE_CATALOG_IDS = new Set(["pipe", "fittings-butt-weld"]);

const FITTING_LABEL_TO_LEAF = [
  { test: (l) => /return|180/.test(l), leaf: "fittings-buttwelding-return" },
  { test: (l) => l.includes("cross"), leaf: "fittings-buttwelding-cross" },
  { test: (l) => l.includes("tee"), leaf: "fittings-buttwelding-tee" },
  { test: (l) => l.includes("cap") && !l.includes("capacity"), leaf: "fittings-buttwelding-cap" },
  { test: (l) => l.includes("reducer"), leaf: "fittings-buttwelding-reducer" },
  { test: (l) => /stud\s*end|stub end|lap joint/.test(l), leaf: "fittings-buttwelding-stud-end" },
];

/**
 * Tree leaf id for catalog UX when `catalogLeafId` was not stored (older parts).
 * @param {{ catalogLeafId?: string, catalogCategory?: string, catalogPartId?: string | null, partType?: string }} part
 * @returns {string}
 */
export function inferCatalogLeafIdFromPart(part) {
  const stored = (part?.catalogLeafId ?? "").trim();
  if (stored) return stored;
  const cat = (part?.catalogCategory ?? "").trim();
  if (!cat) return "";
  if (cat === "pipe") return "pipe";
  if (cat.startsWith("valves-")) return cat;
  if (cat === "fittings-butt-weld") {
    const entry = part?.catalogPartId ? getCatalogEntry(part.catalogPartId) : null;
    const label = (entry?.attributes?.fittingType ?? entry?.partTypeLabel ?? part?.partType ?? "").toLowerCase();
    for (const row of FITTING_LABEL_TO_LEAF) {
      if (row.test(label)) return row.leaf;
    }
    return "fittings-buttwelding-elbow";
  }
  const isJsonFlangeCategory = partCatalog.categories.some((c) => c.id === cat && !NON_FLANGE_CATALOG_IDS.has(c.id));
  if (isJsonFlangeCategory) return `flange-${cat}`;
  return cat;
}

/**
 * @param {string} leafId — tree leaf id (e.g. flange-asme-b16-5, valves-flanged-gate)
 * @returns {string} catalogCategory for part-catalog / hierarchy (matches JSON or virtual family id)
 */
export function leafIdToCatalogCategory(leafId) {
  if (!leafId) return "";
  if (leafId.startsWith("flange-")) return leafId.slice("flange-".length);
  if (leafId === "pipe") return "pipe";
  if (leafId.startsWith("fittings-buttwelding-")) return "fittings-butt-weld";
  if (leafId.startsWith("valves-flanged-")) return leafId;
  if (leafId.startsWith("valves-buttwelded-")) return leafId;
  if (leafId.startsWith("valves-threaded-")) return leafId;
  if (leafId.startsWith("valves-socketwelded-")) return leafId;
  return leafId;
}

/**
 * @param {string} catalogCategory
 * @param {string} [leafId] — original tree leaf (for virtual rows)
 * @returns {object[]}
 */
export function getMergedCatalogEntries(catalogCategory, leafId = "") {
  const fromJson = partCatalog.entries.filter((e) => e.catalogCategory === catalogCategory);
  if (fromJson.length > 0) return fromJson;
  const virtual = buildVirtualValveEntriesForLeaf(leafId || catalogCategory);
  if (virtual.length > 0) return virtual;
  return [];
}

/**
 * Flange standard submenu from part-catalog category list (client-safe, no fs).
 * @param {{ id: string, label: string }[]} categories — from getCategories()
 * @returns {{ id: string, label: string }[]}
 */
export function getFlangeStandardNodesFromCategories(categories) {
  return categories.filter((c) => c?.id && !NON_FLANGE_CATALOG_IDS.has(c.id));
}
