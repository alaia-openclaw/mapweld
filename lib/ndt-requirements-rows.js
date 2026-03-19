/**
 * Normalized NDT requirement rows: { method, pct, pctShop?, pctField? }
 * Shared by project drawingSettings, system.ndtRequirements, line.ndtRequirements.
 */

import { sortNdtMethods } from "./constants";

export function migrateNdtRequirementsRows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === "object" && String(r.method || "").trim())
    .map((r) => {
      const method = String(r.method).trim().toUpperCase();
      const pct = Math.min(100, Math.max(0, Number(r.pct) || 100));
      const next = { method, pct };
      const shop = r.pctShop != null ? Math.min(100, Math.max(0, Number(r.pctShop))) : null;
      const field = r.pctField != null ? Math.min(100, Math.max(0, Number(r.pctField))) : null;
      if (shop != null && shop !== pct) next.pctShop = shop;
      if (field != null && field !== pct) next.pctField = field;
      return next;
    });
}

export function addNdtRequirementRow(prev, method, pct = 100) {
  const normalizedMethod = String(method || "").trim().toUpperCase();
  if (!normalizedMethod) return prev;
  const filtered = prev.filter((r) => r.method !== normalizedMethod);
  const merged = [...filtered, { method: normalizedMethod, pct: Math.min(100, Math.max(0, pct)) }];
  const orderedMethods = sortNdtMethods(merged.map((r) => r.method));
  return merged.sort((a, b) => orderedMethods.indexOf(a.method) - orderedMethods.indexOf(b.method));
}

export function updateNdtRequirementRow(prev, method, field, value) {
  const num = value === "" ? null : parseInt(value, 10);
  if (num !== null && (Number.isNaN(num) || num < 0)) return prev;
  const clamped = num != null ? Math.min(100, Math.max(0, num)) : null;
  return prev.map((r) => {
    if (r.method !== method) return r;
    const next = { ...r };
    if (field === "pct") {
      next.pct = clamped ?? 100;
      delete next.pctShop;
      delete next.pctField;
    } else if (field === "shop") {
      if (clamped == null || clamped === (r.pct ?? 100)) delete next.pctShop;
      else next.pctShop = clamped;
    } else if (field === "field") {
      if (clamped == null || clamped === (r.pct ?? 100)) delete next.pctField;
      else next.pctField = clamped;
    }
    return next;
  });
}

export function removeNdtRequirementRow(prev, method) {
  return prev.filter((r) => r.method !== method);
}
