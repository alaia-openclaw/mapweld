/**
 * Synthetic catalog entries for valve families backed by lib/*-valves-data.js
 * (not in part-catalog.json) so hierarchy selects can resolve catalogPartId.
 */

import { FLANGED_VALVE_TYPES, getFlangedValveRowsForType } from "@/lib/flanged-valves-data";
import { BUTTWELDED_VALVE_TYPES, getButtweldedValveRowsForType } from "@/lib/buttwelded-valves-data";
import { THREADED_VALVE_TYPES, getThreadedValveRowsForType } from "@/lib/threaded-valves-data";

function flangedRowToEntry(typeDef, row) {
  const id = `virt-${typeDef.selectionId}-dn${row.dn}-${row.pressureClass}-${row.faceType ?? row.actuator ?? "x"}`;
  return {
    catalogPartId: id,
    catalogCategory: typeDef.selectionId,
    partTypeLabel: typeDef.label,
    nps: String(row.dn),
    thickness: "",
    weightKg: row.weightKg ?? null,
    surfaceM2: null,
    attributes: {
      rating: row.pressureClass,
      pressureClass: row.pressureClass,
      faceType: row.faceType ?? null,
      actuator: row.actuator ?? null,
      valveToolbar: typeDef.toolbar ?? "face",
    },
  };
}

function simpleRowToEntry(typeDef, row) {
  const id = `virt-${typeDef.selectionId}-dn${row.dn}-${row.pressureClass}`;
  return {
    catalogPartId: id,
    catalogCategory: typeDef.selectionId,
    partTypeLabel: typeDef.label,
    nps: String(row.dn),
    thickness: "",
    weightKg: row.weightKg ?? null,
    surfaceM2: null,
    attributes: {
      rating: row.pressureClass,
      pressureClass: row.pressureClass,
    },
  };
}

/**
 * @param {string} leafId
 * @returns {object[]}
 */
export function buildVirtualValveEntriesForLeaf(leafId) {
  if (!leafId) return [];
  const ft = FLANGED_VALVE_TYPES.find((t) => t.selectionId === leafId);
  if (ft) {
    return getFlangedValveRowsForType(ft.id).map((row) => flangedRowToEntry(ft, row));
  }
  const bt = BUTTWELDED_VALVE_TYPES.find((t) => t.selectionId === leafId);
  if (bt) {
    return getButtweldedValveRowsForType(bt.id).map((row) => simpleRowToEntry(bt, row));
  }
  const tt = THREADED_VALVE_TYPES.find((t) => t.selectionId === leafId);
  if (tt) {
    return getThreadedValveRowsForType(tt.id).map((row) => simpleRowToEntry(tt, row));
  }
  return [];
}

/**
 * Resolve a stored catalogPartId for virtual valve rows (not in part-catalog.json).
 * @param {string} catalogPartId
 * @returns {object | null}
 */
export function getVirtualCatalogEntryById(catalogPartId) {
  if (!catalogPartId?.startsWith("virt-")) return null;
  for (const t of FLANGED_VALVE_TYPES) {
    const found = buildVirtualValveEntriesForLeaf(t.selectionId).find((e) => e.catalogPartId === catalogPartId);
    if (found) return found;
  }
  for (const t of BUTTWELDED_VALVE_TYPES) {
    const found = buildVirtualValveEntriesForLeaf(t.selectionId).find((e) => e.catalogPartId === catalogPartId);
    if (found) return found;
  }
  for (const t of THREADED_VALVE_TYPES) {
    const found = buildVirtualValveEntriesForLeaf(t.selectionId).find((e) => e.catalogPartId === catalogPartId);
    if (found) return found;
  }
  return null;
}
