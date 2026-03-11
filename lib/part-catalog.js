/**
 * Part catalog loader and helpers for cascading dropdowns.
 * Catalog is built from 3CQC data; see scripts/build-part-catalog.js.
 */

import partCatalogData from "@/data/part-catalog.json";

const { categories = [], entries = [] } = partCatalogData;

export const partCatalog = { categories, entries };

export function getCategories() {
  return categories;
}

export function getPartTypesForCategory(categoryId) {
  if (!categoryId) return [];
  const set = new Set();
  entries
    .filter((e) => e.catalogCategory === categoryId)
    .forEach((e) => set.add(e.partTypeLabel));
  return Array.from(set).sort();
}

export function getNpsOptions(categoryId, partTypeLabel) {
  if (!categoryId || !partTypeLabel) return [];
  const set = new Set();
  entries
    .filter(
      (e) =>
        e.catalogCategory === categoryId && e.partTypeLabel === partTypeLabel
    )
    .forEach((e) => set.add(e.nps));
  return Array.from(set).sort((a, b) => {
    const na = parseNpsSort(a);
    const nb = parseNpsSort(b);
    return na - nb;
  });
}

function parseNpsSort(nps) {
  const s = String(nps);
  const m = s.match(/^(\d+)(?:\+(\d+)\/(\d+))?$/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = m[2] ? whole + parseInt(m[2], 10) / parseInt(m[3], 10) : whole;
    return num;
  }
  return parseFloat(s) || 0;
}

export function getThicknessOptions(categoryId, partTypeLabel, nps) {
  if (!categoryId || !partTypeLabel || !nps) return [];
  const set = new Set();
  entries
    .filter(
      (e) =>
        e.catalogCategory === categoryId &&
        e.partTypeLabel === partTypeLabel &&
        e.nps === nps
    )
    .forEach((e) => set.add(e.thickness));
  return Array.from(set).sort();
}

export function getCatalogEntry(catalogPartId) {
  return entries.find((e) => e.catalogPartId === catalogPartId) ?? null;
}

export function findCatalogEntry(categoryId, partTypeLabel, nps, thickness) {
  return (
    entries.find(
      (e) =>
        e.catalogCategory === categoryId &&
        e.partTypeLabel === partTypeLabel &&
        e.nps === nps &&
        e.thickness === thickness
    ) ?? null
  );
}

export function getCatalogPartId(categoryId, partTypeLabel, nps, thickness) {
  const entry = findCatalogEntry(
    categoryId,
    partTypeLabel,
    nps,
    thickness
  );
  return entry ? entry.catalogPartId : null;
}
