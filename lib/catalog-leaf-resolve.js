/**
 * Map Pipedata-style catalog tree leaf ids → part-catalog `catalogCategory` ids
 * and helpers for merged JSON + virtual rows (valves, etc.).
 */

import { partCatalog, getCatalogEntry } from "./part-catalog";
import { buildVirtualValveEntriesForLeaf } from "@/lib/catalog-virtual-valve-entries";
import { parseFittingsSelectionId, filterFittingsBySubtype } from "./catalog-structure";

/** Part-catalog JSON categories that are not flange families */
const NON_FLANGE_CATALOG_IDS = new Set([
  "pipe",
  "fittings-butt-weld",
  "fittings-threaded",
  "fittings-socket-weld",
]);

const FITTING_LABEL_TO_LEAF_BW = [
  { test: (l) => /return|180/.test(l), leaf: "fittings-buttwelding-return" },
  { test: (l) => l.includes("cross"), leaf: "fittings-buttwelding-cross" },
  { test: (l) => l.includes("tee"), leaf: "fittings-buttwelding-tee" },
  { test: (l) => l.includes("cap") && !l.includes("capacity"), leaf: "fittings-buttwelding-cap" },
  { test: (l) => l.includes("reducer"), leaf: "fittings-buttwelding-reducer" },
  { test: (l) => /stud\s*end|stub end|lap joint/.test(l), leaf: "fittings-buttwelding-stud-end" },
];

const FITTING_LABEL_TO_LEAF_THREADED = [
  { test: (l) => l.includes("cross"), leaf: "fittings-threaded-cross" },
  { test: (l) => l.includes("tee"), leaf: "fittings-threaded-tee" },
  { test: (l) => l.includes("cap") && !l.includes("capacity"), leaf: "fittings-threaded-cap" },
  { test: (l) => l.includes("reducer"), leaf: "fittings-threaded-reducer" },
  { test: (l) => l.includes("coupling"), leaf: "fittings-threaded-coupling" },
  { test: (l) => l.includes("plug"), leaf: "fittings-threaded-plug" },
  { test: (l) => l.includes("bushing"), leaf: "fittings-threaded-bushing" },
];

const FITTING_LABEL_TO_LEAF_SW = [
  { test: (l) => l.includes("cross"), leaf: "fittings-socketwelded-cross" },
  { test: (l) => l.includes("tee"), leaf: "fittings-socketwelded-tee" },
  { test: (l) => l.includes("cap") && !l.includes("capacity"), leaf: "fittings-socketwelded-cap" },
  { test: (l) => l.includes("reducer"), leaf: "fittings-socketwelded-reducer" },
  { test: (l) => l.includes("coupling"), leaf: "fittings-socketwelded-coupling" },
  { test: (l) => l.includes("plug"), leaf: "fittings-socketwelded-plug" },
  { test: (l) => l.includes("bushing"), leaf: "fittings-socketwelded-bushing" },
];

function inferLeafFromFittingLabel(cat, label) {
  const l = label.toLowerCase();
  let list = FITTING_LABEL_TO_LEAF_BW;
  let defaultLeaf = "fittings-buttwelding-elbow";
  if (cat === "fittings-threaded") {
    list = FITTING_LABEL_TO_LEAF_THREADED;
    defaultLeaf = "fittings-threaded-elbow";
  } else if (cat === "fittings-socket-weld") {
    list = FITTING_LABEL_TO_LEAF_SW;
    defaultLeaf = "fittings-socketwelded-elbow";
  }
  for (const row of list) {
    if (row.test(l)) return row.leaf;
  }
  return defaultLeaf;
}

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
  if (cat === "fittings-butt-weld" || cat === "fittings-threaded" || cat === "fittings-socket-weld") {
    const entry = part?.catalogPartId ? getCatalogEntry(part.catalogPartId) : null;
    const label = (entry?.attributes?.fittingType ?? entry?.partTypeLabel ?? part?.partType ?? "").toLowerCase();
    return inferLeafFromFittingLabel(cat, label);
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
  if (leafId.startsWith("fittings-threaded-")) return "fittings-threaded";
  if (leafId.startsWith("fittings-socketwelded-")) return "fittings-socket-weld";
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
/**
 * @param {object[]} entries
 * @param {string} catalogLeafId
 */
export function filterCatalogEntriesByLeaf(entries, catalogLeafId) {
  if (!catalogLeafId || !entries?.length) return entries;
  const parsed = parseFittingsSelectionId(catalogLeafId);
  if (!parsed) return entries;
  return filterFittingsBySubtype(entries, parsed.connectionType, parsed.subtypeId);
}

export function getMergedCatalogEntries(catalogCategory, leafId = "") {
  const fromJson = partCatalog.entries.filter((e) => e.catalogCategory === catalogCategory);
  if (fromJson.length > 0) return filterCatalogEntriesByLeaf(fromJson, leafId);
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
