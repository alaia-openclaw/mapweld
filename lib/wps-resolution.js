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
