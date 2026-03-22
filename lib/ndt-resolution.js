/**
 * Resolve NDT requirement rows per weld: project defaults, overridden by system, then by line.
 * Per-method: later layers override pct / pctShop / pctField when that method appears in the layer's list.
 */

import { sortNdtMethods } from "./constants";

/** Legacy: undefined override flag + non-empty rows means user had overrides. */
function effectiveSystemNdtReqs(system) {
  if (!system) return [];
  if (system.ndtOverridesProject === false) return [];
  if (system.ndtOverridesProject === true) return system.ndtRequirements || [];
  return (system.ndtRequirements || []).length > 0 ? (system.ndtRequirements || []) : [];
}

function effectiveLineNdtReqs(line) {
  if (!line) return [];
  if (line.ndtOverridesSystem === false) return [];
  if (line.ndtOverridesSystem === true) return line.ndtRequirements || [];
  return (line.ndtRequirements || []).length > 0 ? (line.ndtRequirements || []) : [];
}

/**
 * @param {object} weld
 * @param {object[]} [spools]
 * @returns {string|null}
 */
export function getWeldLineId(weld, spools = []) {
  if (!weld) return null;
  if (weld.lineId) return weld.lineId;
  const sid = weld.spoolId;
  if (!sid) return null;
  const sp = spools.find((s) => s.id === sid);
  return sp?.lineId ?? null;
}

/**
 * Merge one method's requirement: project base, then system row, then line row (each optional).
 * @param {string} method
 * @param {object[]} projectReqs
 * @param {object[]} systemReqs
 * @param {object[]} lineReqs
 */
export function mergeNdtRequirementRow(method, projectReqs, systemReqs, lineReqs) {
  const p = projectReqs.find((r) => r.method === method);
  const s = systemReqs.find((r) => r.method === method);
  const l = lineReqs.find((r) => r.method === method);
  const base = p
    ? { ...p }
    : { method, pct: 100 };
  const withS = s ? { ...base, ...s, method } : base;
  const withL = l ? { ...withS, ...l, method } : withS;
  return withL;
}

/**
 * All methods that appear in project, system, or line requirement lists (for this weld's scope).
 */
export function collectMethodsForWeld(drawingSettings, system, line) {
  const project = drawingSettings?.ndtRequirements || [];
  const sysReqs = effectiveSystemNdtReqs(system);
  const lineReqs = effectiveLineNdtReqs(line);
  const set = new Set([
    ...project.map((r) => r.method),
    ...sysReqs.map((r) => r.method),
    ...lineReqs.map((r) => r.method),
  ]);
  return sortNdtMethods([...set]);
}

/**
 * Effective merged `ndtRequirements` array for one weld (for pct / eligibility).
 * @param {object} weld
 * @param {object} drawingSettings
 * @param {object[]} systems
 * @param {object[]} lines
 * @param {object[]} spools
 * @returns {object[]}
 */
export function getResolvedNdtRequirementsForWeld(weld, drawingSettings, systems, lines, spools) {
  const project = drawingSettings?.ndtRequirements || [];
  const lineId = getWeldLineId(weld, spools);
  const line = lineId ? lines.find((x) => x.id === lineId) : null;
  const system = line?.systemId ? systems.find((s) => s.id === line.systemId) : null;
  const sysReqs = effectiveSystemNdtReqs(system);
  const lineReqs = effectiveLineNdtReqs(line);
  const methods = collectMethodsForWeld(drawingSettings, system, line);
  if (methods.length === 0) return [...project];
  return methods.map((m) => mergeNdtRequirementRow(m, project, sysReqs, lineReqs));
}

/**
 * Effective NDT rows inherited by a line before line-level overrides (project + system layers).
 * Used in Settings to grey out inherited values when line NDT override is off.
 */
export function getInheritedNdtBeforeLineOverrides(drawingSettings, system) {
  const project = drawingSettings?.ndtRequirements || [];
  const sysReqs = effectiveSystemNdtReqs(system);
  const lineStub = { ndtRequirements: [], ndtOverridesSystem: false };
  const methods = collectMethodsForWeld(drawingSettings, system, lineStub);
  if (methods.length === 0) return [...project];
  return methods.map((m) => mergeNdtRequirementRow(m, project, sysReqs, []));
}

/**
 * @param {object[]} resolvedReqs from getResolvedNdtRequirementsForWeld
 * @param {string} method
 * @param {'shop'|'field'} location
 */
export function getPctFromResolvedRequirements(resolvedReqs, method, location) {
  const req = (resolvedReqs || []).find((r) => r.method === method);
  if (!req) return 100;
  const raw =
    location === "field"
      ? req.pctField ?? req.pct ?? 100
      : req.pctShop ?? req.pct ?? 100;
  return Math.min(100, Math.max(0, Number(raw)));
}

/**
 * Stable inclusion for percentage sampling (same weld + method → same outcome).
 */
export function weldIncludedInPctSample(weldId, method, pct) {
  if (pct >= 100) return true;
  if (pct <= 0) return false;
  let h = 0;
  const key = `${weldId}::${method}`;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  const u = Math.abs(h) % 100;
  return u < pct;
}
