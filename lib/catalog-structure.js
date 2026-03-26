/**
 * Catalog category tree for the Part catalog UI.
 * Used by CatalogSidebar and to map selection to data.
 */

import { getRowsForStandard, matchNonmetallicFlatRow } from "./nonmetallic-flat-gaskets-data";
import { getSpiralRowsForStandard, matchSpiralWoundRow } from "./spiral-wound-gaskets-data";
import { getRingRowsForType, matchRingJointRow } from "./ring-joint-gaskets-data";
import { FLANGED_VALVE_TYPES, getFlangedValveRowsForType, matchFlangedValveRow } from "./flanged-valves-data";
import { BUTTWELDED_VALVE_TYPES, getButtweldedValveRowsForType, matchButtweldedValveRow } from "./buttwelded-valves-data";
import { THREADED_VALVE_TYPES, getThreadedValveRowsForType, matchThreadedValveRow } from "./threaded-valves-data";
import { SOCKETWELDED_VALVE_TYPES, getSocketweldedValveRowsForType, matchSocketweldedValveRow } from "./socketwelded-valves-data";
import { PIPEDATA_CATEGORY_TREE } from "./pipedata-category-tree";
import { looksLikePipeScheduleDesignation } from "./pipe-schedule-designation.js";

export const CATEGORY_TREE = PIPEDATA_CATEGORY_TREE;

/** Map fitting subtype id (e.g. "elbow", "return") to partTypeLabel match. */
const FITTING_SUBTYPE_KEYWORDS = {
  elbow: ["elbow"],
  return: ["return", "180"],
  tee: ["tee"],
  cross: ["cross"],
  cap: ["cap"],
  reducer: ["reducer"],
  "stud-end": ["stud end", "studend"],
  coupling: ["coupling"],
  plug: ["plug"],
  bushing: ["bushing"],
};

/** Parse selection id like "fittings-buttwelding-elbow" into { connectionType, subtypeId }. */
export function parseFittingsSelectionId(selectedId) {
  if (!selectedId?.startsWith("fittings-")) return null;
  const parts = selectedId.split("-");
  if (parts.length < 3) return null;
  const connectionType = `${parts[0]}-${parts[1]}`;
  const subtypeId = parts.slice(2).join("-");
  return { connectionType, subtypeId };
}

export function filterFittingsBySubtype(entries, connectionType, subtypeId) {
  if (
    connectionType === "fittings-buttwelding" ||
    connectionType === "fittings-threaded" ||
    connectionType === "fittings-socketwelded"
  ) {
    const keywords = FITTING_SUBTYPE_KEYWORDS[subtypeId];
    if (!keywords) return entries;
    return entries.filter((e) => {
      const label = (e.partTypeLabel || "").toLowerCase();
      const conn = (e.attributes?.connectionType || "").toLowerCase();
      if (connectionType === "fittings-buttwelding" && conn && !conn.includes("butt")) return false;
      if (connectionType === "fittings-threaded" && conn && !conn.includes("thread")) return false;
      if (connectionType === "fittings-socketwelded" && conn && !conn.includes("socket")) return false;
      return keywords.some((kw) => label.includes(kw));
    });
  }
  return [];
}

function firstLeafUnder(node) {
  if (!node.children?.length) return node.id;
  return firstLeafUnder(node.children[0]);
}

export function getFirstSelectableCategoryId(tree) {
  for (const node of tree) {
    if (node.children?.length) return firstLeafUnder(node.children[0]);
    if (!("children" in node)) return node.id;
  }
  return "pipe";
}

/**
 * Collect all leaf category ids from the tree (for counts).
 * Branch nodes may omit `children` until injected (e.g. flanges) — those are treated as leaves only when they have no `children` key.
 */
export function getAllLeafIds(tree) {
  const ids = [];
  function walk(nodes) {
    for (const node of nodes) {
      if (node.children?.length) walk(node.children);
      else if (!("children" in node)) ids.push(node.id);
    }
  }
  walk(tree);
  return ids;
}

function matchesSearch(text, search) {
  if (!search || !search.trim()) return true;
  const q = search.trim().toLowerCase();
  return String(text ?? "").toLowerCase().includes(q);
}

/** Pipe schedule designation only (e.g. STD, 40); not flange face thickness in mm. */
function getPipeScheduleFromAttributes(a) {
  if (!a || typeof a !== "object") return undefined;
  const priority = ["schedule", "Schedule", "Sch", "SCH", "sch"];
  for (const k of priority) {
    const raw = a[k];
    if (raw != null && String(raw).trim() !== "") return String(raw).trim();
  }
  for (const key of Object.keys(a)) {
    const raw = a[key];
    if (raw == null || String(raw).trim() === "") continue;
    const lk = key.toLowerCase().replace(/\s+/g, " ").trim();
    if (
      /^(schedule|sch|pipe sch|pipe schedule|pipe wall schedule|wall schedule)$/.test(lk) ||
      (lk.includes("schedule") &&
        !/wall thickness|wallthk|flange thickness|insul/i.test(lk) &&
        !/^(thickness|thk)$/.test(lk))
    ) {
      return String(raw).trim();
    }
  }
  return undefined;
}

export { looksLikePipeScheduleDesignation };

/**
 * Pipe schedule for flange rows (bore / matching pipe): STD, XS, 40, 80S, etc.
 * Uses CSV columns such as Sch / Schedule only — not Pipedata `thickness` (face dimension).
 */
export function getFlangePipeScheduleDisplay(row) {
  const a = row.attributes || {};
  const fromAttrs = getPipeScheduleFromAttributes(a);
  if (fromAttrs) return fromAttrs;
  const t = row.thickness;
  if (t != null && looksLikePipeScheduleDesignation(t)) return String(t).trim();
  return "";
}

/**
 * Unique non-empty string values for catalog facet dropdowns (sorted for display).
 */
export function uniqueSortedFacetValues(values) {
  const set = new Set();
  for (const v of values) {
    const s = v != null && String(v).trim() !== "" ? String(v).trim() : null;
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

/** Row value matches a facet id when `selected` is empty (all) or equal after trim. */
export function catalogFacetMatchesScalar(raw, selected) {
  if (!selected) return true;
  return String(raw ?? "").trim() === String(selected).trim();
}

/** Filter property options for the dropdown (id = field key for matching). */
export const FILTER_PROPERTY_OPTIONS = [
  { id: "nps", label: "NPS / NB" },
  { id: "schedule", label: "Pipe schedule" },
  { id: "system", label: "System" },
  { id: "od", label: "OD" },
  { id: "type", label: "Type" },
  { id: "weight", label: "Weight" },
  { id: "wallThk", label: "Wall thk" },
  { id: "id", label: "ID" },
  { id: "pcd", label: "PCD" },
  { id: "thickness", label: "Thickness" },
  { id: "pressureClass", label: "Pressure class" },
  { id: "standard", label: "Standard" },
];

function getEntryPropertyValue(entry, propertyId) {
  const a = entry.attributes || {};
  switch (propertyId) {
    case "nps":
      return entry.nps;
    case "schedule":
      return getPipeScheduleFromAttributes(a);
    case "system":
      return a.system;
    case "od":
      return a.od;
    case "type":
      return entry.partTypeLabel;
    case "weight":
      return entry.weightKg;
    case "wallThk":
      return a.wallThk;
    case "id":
      return a.id;
    default:
      return a[propertyId] ?? entry[propertyId];
  }
}

function getFlangeRowPropertyValue(row, propertyId) {
  const a = row.attributes || {};
  switch (propertyId) {
    case "nps":
      return row.nps;
    case "schedule":
      return getFlangePipeScheduleDisplay(row) || undefined;
    case "system":
      return row.system;
    case "od":
      return row.od;
    case "type":
      return null;
    case "weight":
      return a["wn kg"] ?? a["so kg"];
    case "wallThk":
      return a.thickness;
    case "id":
      return a.ID ?? a.id;
    case "pcd":
      return row.pcd ?? a.pcd;
    case "thickness":
      return a.thickness;
    case "pressureClass":
      return row.pressureClass;
    case "standard":
      return row.standardLabel;
    default:
      return a[propertyId] ?? row[propertyId];
  }
}

/** Imperial vs metric datasets (matches `attributes.system` on pipe/fittings; `row.system` on flange rows). */
export const CATALOG_UNIT_SYSTEMS = ["Imperial", "Metric"];

/** Pipe/fittings entry: same part in Imperial or Metric; filter by `attributes.system`. */
export function entryMatchesCatalogUnitSystem(entry, catalogUnitSystem) {
  if (!catalogUnitSystem) return true;
  const sys = entry?.attributes?.system;
  if (sys == null || String(sys).trim() === "") return true;
  return String(sys).trim() === catalogUnitSystem;
}

/** Flange dimension row includes dataset `system` (Imperial / Metric). */
export function flangeRowMatchesCatalogUnitSystem(row, catalogUnitSystem) {
  if (!catalogUnitSystem) return true;
  const sys = row?.system;
  if (sys == null || String(sys).trim() === "") return true;
  return String(sys).trim() === catalogUnitSystem;
}

/** Match entry/row value against filter value (string from value dropdown, or legacy array). */
function propertyValueMatches(value, filterValue) {
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    const v = String(value ?? "").trim();
    return filterValue.some((fv) => String(fv ?? "").trim() === v);
  }
  if (filterValue == null || String(filterValue).trim() === "") return true;
  const v = String(value ?? "").trim();
  const q = String(filterValue).trim();
  return v === q;
}

/** Collect unique non-empty values for a property from all catalog data. */
export function getPropertyValueOptions(
  propertyId,
  {
    pipeEntries = [],
    fittingsEntries = [],
    flangesStandards = [],
    catalogUnitSystem = null,
  }
) {
  const set = new Set();
  const add = (val) => {
    const s = val != null && val !== "" ? String(val).trim() : null;
    if (s) set.add(s);
  };

  for (const e of pipeEntries) {
    if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) continue;
    add(getEntryPropertyValue(e, propertyId));
  }
  for (const e of fittingsEntries) {
    if (!entryMatchesCatalogUnitSystem(e, catalogUnitSystem)) continue;
    add(getEntryPropertyValue(e, propertyId));
  }
  const flangeRows = flattenFlangeRows(flangesStandards);
  for (const row of flangeRows) {
    if (!flangeRowMatchesCatalogUnitSystem(row, catalogUnitSystem)) continue;
    add(getFlangeRowPropertyValue(row, propertyId));
  }

  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
}

/** Get options for every filter property. */
export function getPropertyValueOptionsForAll(data) {
  const out = {};
  for (const opt of FILTER_PROPERTY_OPTIONS) {
    out[opt.id] = getPropertyValueOptions(opt.id, data);
  }
  return out;
}

/** Return true if a pipe or fittings entry matches the search string. */
export function matchEntrySearch(entry, search) {
  if (!search?.trim()) return true;
  const fields = [
    entry.nps,
    entry.partTypeLabel,
    entry.thickness,
    entry.attributes?.schedule,
    entry.attributes?.system,
    entry.attributes?.od,
    entry.attributes?.wallThk,
    entry.attributes?.id,
  ].filter(Boolean);
  const q = search.trim().toLowerCase();
  return fields.some((f) => String(f).toLowerCase().includes(q));
}

/** Return true if entry matches all filters (each filter: property equals selected value, or Any). */
export function matchEntryFilters(entry, filters) {
  if (!Array.isArray(filters) || filters.length === 0) return true;
  return filters.every((f) => {
    const value = getEntryPropertyValue(entry, f.property);
    return propertyValueMatches(value, f.value);
  });
}

/** Return true if flange row matches all filters. */
export function matchFlangeRowFilters(row, filters) {
  if (!Array.isArray(filters) || filters.length === 0) return true;
  return filters.every((f) => {
    const value = getFlangeRowPropertyValue(row, f.property);
    return propertyValueMatches(value, f.value);
  });
}

/** Flatten all flange dimension rows from standards for counting/filtering. */
export function flattenFlangeRows(standards) {
  const rows = [];
  for (const std of standards) {
    for (const cls of std.classes || []) {
      for (const ds of cls.datasets || []) {
        for (const row of ds.rows || []) {
          rows.push({
            ...row,
            standardId: std.id,
            standardLabel: std.label,
            pressureClass: cls.pressureClass,
          });
        }
      }
    }
  }
  return rows;
}

/** Return tree with Flanges node's children set from flangesStandards (for sidebar submenu). */
export function injectFlangeChildren(tree, flangesStandards = []) {
  return tree.map((node) => {
    if (node.id === "flanges") {
      const children = flangesStandards.map((s) => ({
        id: `flange-${s.id}`,
        label: s.label,
      }));
      return { ...node, children };
    }
    if (node.children?.length) {
      return { ...node, children: injectFlangeChildren(node.children, []) };
    }
    return node;
  });
}

/**
 * Inject flange standards using part-catalog category list (client-safe; no fs).
 * @param {import("@/lib/part-catalog").Category[]} catalogCategories — from getCategories()
 */
export function injectFlangeChildrenFromPartCatalog(tree, catalogCategories = []) {
  const flangeNodes = catalogCategories
    .filter((c) => c?.id && c.id !== "pipe" && c.id !== "fittings-butt-weld")
    .map((c) => ({ id: `flange-${c.id}`, label: c.label }));
  return tree.map((node) => {
    if (node.id === "flanges") {
      return { ...node, children: flangeNodes };
    }
    if (node.children?.length) {
      return { ...node, children: injectFlangeChildrenFromPartCatalog(node.children, catalogCategories) };
    }
    return node;
  });
}

export function matchFlangeRowSearch(row, search) {
  if (!search?.trim()) return true;
  const fields = [
    row.nps,
    row.od,
    row.pcd,
    row.thickness,
    row.standardLabel,
    row.pressureClass,
    ...Object.values(row.attributes || {}),
  ].filter(Boolean);
  const q = search.trim().toLowerCase();
  return fields.some((f) => String(f).toLowerCase().includes(q));
}

/**
 * Compute per-category counts (leaf ids only) given search, filters, and catalog data.
 * Used for sidebar badges; counts update when search or filters change.
 * Pass `tree` (e.g. injectFlangeChildren(CATEGORY_TREE, flangesStandards)) so every sidebar leaf gets a count; unknown leaves stay 0.
 */
export function computeCategoryCounts(
  search,
  filters,
  {
    pipeEntries = [],
    fittingsEntries = [],
    flangesStandards = [],
    tree: treeArg = null,
    catalogUnitSystem = null,
  }
) {
  const categoryTree = treeArg ?? injectFlangeChildren(CATEGORY_TREE, flangesStandards);
  const counts = Object.fromEntries(getAllLeafIds(categoryTree).map((id) => [id, 0]));

  const matchPipe = (e) =>
    matchEntrySearch(e, search) &&
    matchEntryFilters(e, filters) &&
    entryMatchesCatalogUnitSystem(e, catalogUnitSystem);
  const matchFitting = (e) =>
    matchEntrySearch(e, search) &&
    matchEntryFilters(e, filters) &&
    entryMatchesCatalogUnitSystem(e, catalogUnitSystem);

  counts.pipe = pipeEntries.filter(matchPipe).length;

  const flangeRows = flattenFlangeRows(flangesStandards);
  const matchFlangeRow = (r) =>
    matchFlangeRowSearch(r, search) &&
    matchFlangeRowFilters(r, filters) &&
    flangeRowMatchesCatalogUnitSystem(r, catalogUnitSystem);
  for (const std of flangesStandards) {
    counts[`flange-${std.id}`] = flangeRows
      .filter((r) => r.standardId === std.id && matchFlangeRow(r))
      .length;
  }
  counts.flanges = Object.keys(counts)
    .filter((k) => k.startsWith("flange-"))
    .reduce((sum, k) => sum + counts[k], 0);

  counts["gasket-nonmetallic-flat-b16-5"] = getRowsForStandard("b16-5").filter((r) =>
    matchNonmetallicFlatRow(r, search)
  ).length;
  counts["gasket-nonmetallic-flat-b16-47a"] = getRowsForStandard("b16-47a").filter((r) =>
    matchNonmetallicFlatRow(r, search)
  ).length;
  counts["gasket-nonmetallic-flat-b16-47b"] = getRowsForStandard("b16-47b").filter((r) =>
    matchNonmetallicFlatRow(r, search)
  ).length;
  counts["gasket-spiral-wound-b16-5"] = getSpiralRowsForStandard("b16-5").filter((r) =>
    matchSpiralWoundRow(r, search)
  ).length;
  counts["gasket-spiral-wound-b16-47a"] = getSpiralRowsForStandard("b16-47a").filter((r) =>
    matchSpiralWoundRow(r, search)
  ).length;
  counts["gasket-spiral-wound-b16-47b"] = getSpiralRowsForStandard("b16-47b").filter((r) =>
    matchSpiralWoundRow(r, search)
  ).length;
  counts["gasket-spiral-wound"] =
    counts["gasket-spiral-wound-b16-5"] +
    counts["gasket-spiral-wound-b16-47a"] +
    counts["gasket-spiral-wound-b16-47b"];
  counts["gasket-ring-joint-r"] = getRingRowsForType("r").filter((r) => matchRingJointRow(r, search)).length;
  counts["gasket-ring-joint-rx"] = getRingRowsForType("rx").filter((r) => matchRingJointRow(r, search)).length;
  counts["gasket-ring-joint-bx"] = getRingRowsForType("bx").filter((r) => matchRingJointRow(r, search)).length;
  counts["gasket-ring-joint"] =
    counts["gasket-ring-joint-r"] + counts["gasket-ring-joint-rx"] + counts["gasket-ring-joint-bx"];
  counts.gasket =
    counts["gasket-nonmetallic-flat-b16-5"] +
    counts["gasket-nonmetallic-flat-b16-47a"] +
    counts["gasket-nonmetallic-flat-b16-47b"] +
    counts["gasket-spiral-wound-b16-5"] +
    counts["gasket-spiral-wound-b16-47a"] +
    counts["gasket-spiral-wound-b16-47b"] +
    counts["gasket-ring-joint-r"] +
    counts["gasket-ring-joint-rx"] +
    counts["gasket-ring-joint-bx"];
  counts["gasket-nonmetallic-flat"] =
    counts["gasket-nonmetallic-flat-b16-5"] +
    counts["gasket-nonmetallic-flat-b16-47a"] +
    counts["gasket-nonmetallic-flat-b16-47b"];

  let valvesFlangedSum = 0;
  for (const t of FLANGED_VALVE_TYPES) {
    const n = getFlangedValveRowsForType(t.id).filter((r) => matchFlangedValveRow(r, search)).length;
    counts[t.selectionId] = n;
    valvesFlangedSum += n;
  }
  counts["valves-flanged"] = valvesFlangedSum;

  let valvesButtweldedSum = 0;
  for (const t of BUTTWELDED_VALVE_TYPES) {
    const n = getButtweldedValveRowsForType(t.id).filter((r) => matchButtweldedValveRow(r, search)).length;
    counts[t.selectionId] = n;
    valvesButtweldedSum += n;
  }
  counts["valves-buttwelded"] = valvesButtweldedSum;

  let valvesThreadedSum = 0;
  for (const t of THREADED_VALVE_TYPES) {
    const n = getThreadedValveRowsForType(t.id).filter((r) => matchThreadedValveRow(r, search)).length;
    counts[t.selectionId] = n;
    valvesThreadedSum += n;
  }
  counts["valves-threaded"] = valvesThreadedSum;

  let valvesSocketweldedSum = 0;
  for (const t of SOCKETWELDED_VALVE_TYPES) {
    const n = getSocketweldedValveRowsForType(t.id).filter((r) => matchSocketweldedValveRow(r, search)).length;
    counts[t.selectionId] = n;
    valvesSocketweldedSum += n;
  }
  counts["valves-socketwelded"] = valvesSocketweldedSum;

  counts.valves = valvesFlangedSum + valvesButtweldedSum + valvesThreadedSum + valvesSocketweldedSum;

  const fittingsParsed = (id) => {
    const p = parseFittingsSelectionId(id);
    if (!p) return [];
    return filterFittingsBySubtype(fittingsEntries, p.connectionType, p.subtypeId);
  };

  for (const id of [
    "fittings-buttwelding-elbow",
    "fittings-buttwelding-return",
    "fittings-buttwelding-tee",
    "fittings-buttwelding-cross",
    "fittings-buttwelding-cap",
    "fittings-buttwelding-reducer",
    "fittings-buttwelding-stud-end",
    "fittings-threaded-elbow",
    "fittings-threaded-tee",
    "fittings-threaded-cross",
    "fittings-threaded-coupling",
    "fittings-threaded-cap",
    "fittings-threaded-plug",
    "fittings-threaded-bushing",
    "fittings-socketwelded-elbow",
    "fittings-socketwelded-tee",
    "fittings-socketwelded-cross",
    "fittings-socketwelded-coupling",
    "fittings-socketwelded-cap",
    "fittings-socketwelded-plug",
    "fittings-socketwelded-bushing",
    "fittings-swage-generic",
  ]) {
    counts[id] = fittingsParsed(id).filter(matchFitting).length;
  }

  return counts;
}
