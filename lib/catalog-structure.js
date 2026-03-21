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

/** Collect all leaf category ids from the tree (for counts). */
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

/** Filter property options for the dropdown (id = field key for matching). */
export const FILTER_PROPERTY_OPTIONS = [
  { id: "nps", label: "NPS / NB" },
  { id: "schedule", label: "Schedule" },
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
      return a.schedule ?? entry.thickness;
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
      return row.thickness ?? a.schedule;
    case "system":
      return row.system;
    case "od":
      return row.od;
    case "type":
      return null;
    case "weight":
      return a["wn kg"] ?? a["so kg"];
    case "wallThk":
      return row.thickness ?? a.thickness;
    case "id":
      return a.ID ?? a.id;
    case "pcd":
      return row.pcd ?? a.pcd;
    case "thickness":
      return row.thickness ?? a.thickness;
    case "pressureClass":
      return row.pressureClass;
    case "standard":
      return row.standardLabel;
    default:
      return a[propertyId] ?? row[propertyId];
  }
}

/** Match entry/row value against filter value (string or array of selected values). */
function propertyValueMatches(value, filterValue) {
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    const v = String(value ?? "").trim();
    return filterValue.some((fv) => String(fv ?? "").trim() === v);
  }
  if (!filterValue?.trim()) return true;
  const v = String(value ?? "").toLowerCase();
  const q = String(filterValue).trim().toLowerCase();
  return v.includes(q);
}

/** Collect unique non-empty values for a property from all catalog data. */
export function getPropertyValueOptions(
  propertyId,
  { pipeEntries = [], fittingsEntries = [], flangesStandards = [] }
) {
  const set = new Set();
  const add = (val) => {
    const s = val != null && val !== "" ? String(val).trim() : null;
    if (s) set.add(s);
  };

  for (const e of pipeEntries) add(getEntryPropertyValue(e, propertyId));
  for (const e of fittingsEntries) add(getEntryPropertyValue(e, propertyId));
  const flangeRows = flattenFlangeRows(flangesStandards);
  for (const row of flangeRows) add(getFlangeRowPropertyValue(row, propertyId));

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

/** Return true if entry matches all filters (each filter: property contains value). */
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
 */
export function computeCategoryCounts(
  search,
  filters,
  { pipeEntries = [], fittingsEntries = [], flangesStandards = [] }
) {
  const counts = {};
  const matchPipe = (e) =>
    matchEntrySearch(e, search) && matchEntryFilters(e, filters);
  const matchFitting = (e) =>
    matchEntrySearch(e, search) && matchEntryFilters(e, filters);

  counts.pipe = pipeEntries.filter(matchPipe).length;

  const flangeRows = flattenFlangeRows(flangesStandards);
  const matchFlangeRow = (r) =>
    matchFlangeRowSearch(r, search) && matchFlangeRowFilters(r, filters);
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
  counts["line-blanks"] = 0;

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
  ]) {
    counts[id] = fittingsParsed(id).filter(matchFitting).length;
  }

  return counts;
}
