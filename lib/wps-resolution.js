/**
 * WPS code inheritance: weld override → line → system (same scope as NDT line resolution).
 */

import { getWeldLineId } from "./ndt-resolution";

/**
 * WPS from line, then parent system (ignores weld.wps). For UI “inherited” hints.
 */
export function getInheritedWpsCode(weld, systems, lines, spools) {
  const lineId = getWeldLineId(weld, spools);
  const line = lineId ? (lines || []).find((x) => x.id === lineId) : null;
  const lineWps = (line?.wps ?? "").trim();
  if (lineWps) return lineWps;
  const system = line?.systemId ? (systems || []).find((s) => s.id === line.systemId) : null;
  return (system?.wps ?? "").trim();
}

/**
 * Where {@link getInheritedWpsCode} gets its value from (line wins over system).
 * @returns {"line"|"system"|null}
 */
export function getInheritedWpsSource(weld, systems, lines, spools) {
  const lineId = getWeldLineId(weld, spools);
  const line = lineId ? (lines || []).find((x) => x.id === lineId) : null;
  const lineWps = (line?.wps ?? "").trim();
  if (lineWps) return "line";
  const system = line?.systemId ? (systems || []).find((s) => s.id === line.systemId) : null;
  const sysWps = (system?.wps ?? "").trim();
  if (sysWps) return "system";
  return null;
}

/**
 * Effective WPS: explicit weld.wps if set, else line, else system.
 */
export function getResolvedWpsCode(weld, systems, lines, spools) {
  const direct = (weld?.wps ?? "").trim();
  if (direct) return direct;
  return getInheritedWpsCode(weld, systems, lines, spools);
}

/**
 * @param {object[]} wpsLibrary
 * @param {string|null|undefined} entryId
 * @returns {object|null}
 */
export function getWpsLibraryEntryById(wpsLibrary, entryId) {
  if (!entryId || !Array.isArray(wpsLibrary)) return null;
  return wpsLibrary.find((e) => e?.id === entryId) || null;
}

/**
 * Stored WPS text for a library row: explicit `code`, else `title` (Settings uses title as the name).
 */
export function getWpsLibraryEntryEffectiveCode(entry) {
  if (!entry) return "";
  const c = (entry.code || "").trim();
  if (c) return c;
  return (entry.title || "").trim();
}

/**
 * Rows that belong in the weld WPS dropdown "Registered WPS" list.
 * Excludes rows auto-created by {@link syncWpsLibraryOnWeldSave} when a weld saved a manual
 * WPS with no library match (`weldSyncAuto`), and legacy rows with the same shape (title-only, no code/PDF).
 * Settings → Add WPS must assign a code or PDF so the new row appears here and in the Settings WPS table.
 */
export function isWpsLibraryEntryRegisteredForDropdown(entry) {
  if (!entry) return false;
  if (entry.weldSyncAuto === true) return false;
  if ((entry.code || "").trim()) return true;
  if (entry.documentId) return true;
  return false;
}

/**
 * True if user-typed WPS text matches this library row (effective code, or explicit code, or title).
 * Case-insensitive so "wps01" links to a row titled "WPS01".
 */
export function wpsLibraryEntryMatchesUserText(entry, rawText) {
  const t = (rawText || "").trim().toLowerCase();
  if (!t) return false;
  const code = (entry.code || "").trim().toLowerCase();
  const title = (entry.title || "").trim().toLowerCase();
  const eff = getWpsLibraryEntryEffectiveCode(entry).toLowerCase();
  return t === eff || (!!code && t === code) || (!!title && t === title);
}

/**
 * @param {object[]} wpsLibrary
 * @param {string} rawText
 * @returns {object[]}
 */
export function findWpsLibraryEntriesMatchingUserText(wpsLibrary, rawText) {
  const list = Array.isArray(wpsLibrary) ? wpsLibrary : [];
  return list.filter((e) => wpsLibraryEntryMatchesUserText(e, rawText));
}

/**
 * Effective WPS strings on welds that do not match any **registered** library row
 * (see {@link isWpsLibraryEntryRegisteredForDropdown}). Auto-sync rows from weld saves are ignored.
 * Grouped by resolved code; each group lists the welds using that string.
 * @param {object[]} weldPoints
 * @param {object[]} wpsLibrary
 * @param {object[]} systems
 * @param {object[]} lines
 * @param {object[]} spools
 * @returns {{ displayCode: string; welds: object[] }[]}
 */
export function getUnregisteredWpsUsageGroups(weldPoints, wpsLibrary, systems, lines, spools) {
  const lib = Array.isArray(wpsLibrary) ? wpsLibrary : [];
  const welds = Array.isArray(weldPoints) ? weldPoints : [];
  const byCode = new Map();
  for (const w of welds) {
    const resolved = getResolvedWpsCode(w, systems, lines, spools).trim();
    if (!resolved) continue;
    const matchesRegistered = findWpsLibraryEntriesMatchingUserText(lib, resolved).filter((e) =>
      isWpsLibraryEntryRegisteredForDropdown(e)
    );
    if (matchesRegistered.length > 0) continue;
    if (!byCode.has(resolved)) byCode.set(resolved, []);
    byCode.get(resolved).push(w);
  }
  return [...byCode.entries()]
    .map(([displayCode, groupWelds]) => ({ displayCode, welds: groupWelds }))
    .sort((a, b) => a.displayCode.localeCompare(b.displayCode));
}

export function createWpsLibraryEntryId() {
  return `wpslib-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * When saving a weld: link to an existing library row by typed text (code/title/effective), or append a new row.
 * Canonicalizes `merged.wps` to the matched row's effective code when a match exists.
 *
 * @param {object} weld
 * @param {object[]} wpsLibrary
 * @returns {{ mergedWeld: object, nextWpsLibrary: object[] }}
 */
export function syncWpsLibraryOnWeldSave(weld, wpsLibrary) {
  const lib = Array.isArray(wpsLibrary) ? wpsLibrary : [];
  const merged = { ...weld };
  const wpsTrim = (merged.wps ?? "").trim();

  if (!wpsTrim) {
    return { mergedWeld: merged, nextWpsLibrary: lib };
  }

  const matches = findWpsLibraryEntriesMatchingUserText(lib, wpsTrim);
  if (matches.length >= 1) {
    const pick = [...matches].sort((a, b) => (a.id || "").localeCompare(b.id || ""))[0];
    merged.wpsLibraryEntryId = pick.id;
    merged.wps = getWpsLibraryEntryEffectiveCode(pick);
    return { mergedWeld: merged, nextWpsLibrary: lib };
  }

  const newId = createWpsLibraryEntryId();
  const newEntry = {
    id: newId,
    code: "",
    title: wpsTrim,
    description: "",
    documentId: null,
    weldSyncAuto: true,
  };
  merged.wpsLibraryEntryId = newId;
  merged.wps = wpsTrim;
  return { mergedWeld: merged, nextWpsLibrary: [...lib, newEntry] };
}
